import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Get region from environment variable
const AWS_REGION = process.env.AWS_REGION || "us-east-2";

// Initialize S3 client with region from environment
const createS3Client = () => {
  console.log("Creating S3 client with region:", AWS_REGION);
  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
};

export async function GET(request: NextRequest) {
  console.log("\n\n============================================");
  console.log("🔥 PROXY-PDF ROUTE CALLED!");
  console.log("Full Request URL:", request.url);
  console.log("Timestamp:", new Date().toISOString());
  console.log("============================================\n");

  // Validate AWS credentials are available
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  console.log("AWS Credentials Check:");
  console.log(
    "- Access Key ID present:",
    !!accessKeyId,
    accessKeyId ? `(${accessKeyId.substring(0, 8)}...)` : "(missing)",
  );
  console.log(
    "- Secret Access Key present:",
    !!secretAccessKey,
    secretAccessKey ? "(present)" : "(missing)",
  );
  console.log("- Region:", AWS_REGION);

  if (!accessKeyId || !secretAccessKey) {
    console.error("❌ AWS credentials not found in environment variables!");
    return NextResponse.json(
      {
        error: "Server configuration error",
        message:
          "AWS credentials are not properly configured. Please check server environment variables.",
        debug: {
          hasAccessKey: !!accessKeyId,
          hasSecretKey: !!secretAccessKey,
          region: AWS_REGION,
        },
      },
      { status: 500 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    console.log("=== PDF Proxy Request ===");
    console.log("Requested URL:", url);

    if (!url) {
      console.error("No URL parameter provided");
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    // Validate that it's an S3 URL
    if (!url.includes("s3.amazonaws.com") && !url.includes(".s3.")) {
      return NextResponse.json(
        { error: "Only S3 URLs are allowed" },
        { status: 400 },
      );
    }

    // Parse S3 URL to get bucket, key, and region
    // Format: https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf
    // or https://bucket-name.s3.amazonaws.com/path/to/file.pdf
    // or https://s3.amazonaws.com/bucket-name/path/to/file.pdf
    let bucket = "";
    let key = "";
    let region = AWS_REGION; // Default from env

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname.substring(1); // Remove leading slash

      if (hostname.includes(".s3.")) {
        // Format: bucket-name.s3.region.amazonaws.com or bucket-name.s3.amazonaws.com
        const parts = hostname.split(".s3.");
        bucket = parts[0];
        key = pathname;

        // Extract region if present (e.g., us-east-1.amazonaws.com)
        const afterS3 = parts[1];
        if (afterS3 && !afterS3.startsWith("amazonaws.com")) {
          const regionMatch = afterS3.match(/^([a-z0-9-]+)\./);
          if (regionMatch) {
            region = regionMatch[1];
          }
        }
      } else if (hostname === "s3.amazonaws.com") {
        // Format: s3.amazonaws.com/bucket-name/...
        const parts = pathname.split("/");
        bucket = parts[0];
        key = parts.slice(1).join("/");
      }

      console.log("Parsed S3:", { bucket, key, region });

      if (!bucket || !key) {
        throw new Error("Could not parse bucket and key from URL");
      }
    } catch (parseError: any) {
      console.error("URL parsing error:", parseError);
      return NextResponse.json(
        { error: "Invalid S3 URL format", message: parseError.message },
        { status: 400 },
      );
    }

    // Create S3 client with the extracted or default region
    console.log("Using region:", region, "for bucket:", bucket);
    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: false, // Use virtual-hosted-style URLs
      useAccelerateEndpoint: false,
    });

    // Create GetObject command
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // Generate a presigned URL and fetch it (handles redirects automatically)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    console.log("Generated presigned URL:", presignedUrl);

    // Fetch the PDF using the presigned URL (follows redirects)
    const fetchResponse = await fetch(presignedUrl, {
      redirect: "follow",
    });

    console.log("Fetch response status:", fetchResponse.status);
    console.log(
      "Fetch response headers:",
      Object.fromEntries(fetchResponse.headers.entries()),
    );

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error("❌ Fetch error:", fetchResponse.status, errorText);

      // Try to parse XML error if it's from S3
      if (errorText.includes("<?xml")) {
        console.error("S3 XML Error Response:", errorText);

        // If it's a redirect error, extract the correct endpoint
        if (
          errorText.includes("PermanentRedirect") &&
          errorText.includes("Endpoint")
        ) {
          const endpointMatch = errorText.match(/<Endpoint>(.*?)<\/Endpoint>/);
          if (endpointMatch) {
            const correctEndpoint = endpointMatch[1];
            console.log("S3 suggests using endpoint:", correctEndpoint);

            // Extract region from endpoint
            const regionMatch = correctEndpoint.match(
              /s3[.-]([a-z0-9-]+)\.amazonaws\.com/,
            );
            if (regionMatch) {
              const correctRegion = regionMatch[1];
              console.log("Retrying with correct region:", correctRegion);

              // Retry with the correct region
              const retryClient = new S3Client({
                region: correctRegion,
                credentials: {
                  accessKeyId: accessKeyId,
                  secretAccessKey: secretAccessKey,
                },
                forcePathStyle: false,
              });

              const retryCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
              });

              const retryPresignedUrl = await getSignedUrl(
                retryClient,
                retryCommand,
                {
                  expiresIn: 3600,
                },
              );

              const retryResponse = await fetch(retryPresignedUrl, {
                redirect: "follow",
              });

              if (retryResponse.ok) {
                const retryBuffer = Buffer.from(
                  await retryResponse.arrayBuffer(),
                );
                console.log(
                  "✅ Successfully fetched PDF after retry, size:",
                  retryBuffer.length,
                );

                return new NextResponse(retryBuffer, {
                  status: 200,
                  headers: {
                    "Content-Type":
                      retryResponse.headers.get("content-type") ||
                      "application/pdf",
                    "Content-Disposition": "inline",
                    "Content-Length": retryBuffer.length.toString(),
                    "Cache-Control": "public, max-age=3600",
                  },
                });
              }
            }
          }
        }
      }

      return NextResponse.json(
        {
          error: "Failed to fetch PDF",
          message: errorText,
          status: fetchResponse.status,
        },
        { status: fetchResponse.status },
      );
    }

    const buffer = Buffer.from(await fetchResponse.arrayBuffer());
    console.log("Successfully fetched PDF, size:", buffer.length);

    // Return the PDF with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          fetchResponse.headers.get("content-type") || "application/pdf",
        "Content-Disposition": "inline",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error proxying PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch PDF from S3",
        message: error.message,
        code: error.Code || error.code,
      },
      { status: error.$metadata?.httpStatusCode || 500 },
    );
  }
}
