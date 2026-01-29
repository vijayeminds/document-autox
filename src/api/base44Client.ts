// Mock API client for demo purposes
const mockDocuments = Array.from({ length: 100 }, (_, i) => ({
  id: `doc-${i}`,
  document_type: ["Invoice", "PO", "ASN"][i % 3],
  vendor: ["Acme Corp", "Tech Solutions", "Global Supplies", "Prime Vendor"][
    i % 4
  ],
  status: ["Received", "Processing", "Linked", "Needs Review", "Exception"][
    i % 5
  ],
  total_amount: Math.random() * 10000,
  created_date: new Date(
    Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

const mockExceptions = Array.from({ length: 20 }, (_, i) => ({
  id: `exc-${i}`,
  document_id: `doc-${i}`,
  exception_type: ["Duplicate", "Price Variance", "Missing PO", "Tax Mismatch"][
    i % 4
  ],
  severity: ["Low", "Medium", "High"][i % 3],
  created_date: new Date(
    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
  ).toISOString(),
  resolved_at:
    i % 3 === 0
      ? new Date(
          Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000,
        ).toISOString()
      : null,
}));

const mockApprovals = Array.from({ length: 30 }, (_, i) => ({
  id: `app-${i}`,
  document_id: `doc-${i}`,
  decision: ["Approved", "Rejected", "Pending"][i % 3],
  approval_type: ["Standard", "Override"][i % 2],
  created_date: new Date(
    Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

const mockAuditLogs = Array.from({ length: 50 }, (_, i) => ({
  id: `audit-${i}`,
  action: "Document processed",
  created_date: new Date(
    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

const mockUsers = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i}`,
  name: `User ${i}`,
  full_name: `User Full Name ${i}`,
  email: `user${i}@example.com`,
  role: ["Admin", "AP Manager", "Approver", "Viewer"][i % 4],
  created_date: new Date(
    Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
  ).toISOString(),
}));

export const base44 = {
  auth: {
    me: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        full_name: "John Doe",
        role: "AP Manager",
      };
    },
    logout: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log("User logged out");
    },
  },
  entities: {
    Document: {
      list: async (sort: string, limit: number) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockDocuments;
      },
    },
    Exception: {
      list: async (sort: string, limit: number) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockExceptions;
      },
    },
    Approval: {
      list: async (sort: string, limit: number) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockApprovals;
      },
      update: async (id: string, data: any) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { id, ...data };
      },
    },
    AuditLog: {
      list: async (sort: string, limit: number) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockAuditLogs;
      },
      create: async (data: any) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          id: `audit-${Date.now()}`,
          ...data,
          created_date: new Date().toISOString(),
        };
      },
    },
    User: {
      list: async (sort: string, limit: number) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockUsers;
      },
      update: async (id: string, data: any) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const userIndex = mockUsers.findIndex((u) => u.id === id);
        if (userIndex >= 0) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
          return mockUsers[userIndex];
        }
        return { id, ...data };
      },
    },
  },
};
