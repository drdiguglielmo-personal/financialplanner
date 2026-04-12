import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard.jsx";
import * as financeSync from "../services/financeSync.js";
import { BankService } from "../services/bank.js";

vi.mock("../services/financeSync.js", () => ({
  loadPersistedFinance: vi.fn(),
  persistFinance: vi.fn(),
}));

vi.mock("../services/bank.js", () => ({
  BankService: {
    connect: vi.fn(),
    getTransactions: vi.fn(),
    getAccounts: vi.fn(),
  },
}));

vi.mock("../services/auth.js", () => ({
  AuthService: {
    logout: vi.fn(),
  },
}));

const mockUser = {
  id: "parseUser123",
  name: "Alex Johnson",
  email: "alex@test.com",
};

const minimalGoals = [
  { id: "g001", name: "Emergency Fund", target: 10000, current: 100, color: "#4ade80", icon: "🛡️" },
];

function baseBundle(overrides = {}) {
  return {
    budgets: {},
    manualExpenses: [],
    goals: minimalGoals,
    bankConnected: false,
    ...overrides,
  };
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.mocked(financeSync.loadPersistedFinance).mockResolvedValue(baseBundle());
    vi.mocked(financeSync.persistFinance).mockResolvedValue(undefined);
    vi.mocked(BankService.getAccounts).mockResolvedValue([
      { id: "acc_checking", name: "Chase Checking", type: "checking", balance: 100, bank: "Chase" },
    ]);
    vi.mocked(BankService.getTransactions).mockResolvedValue([]);
  });

  it("shows finance loading then dashboard with bank connect when not linked", async () => {
    render(<Dashboard user={mockUser} />);

    expect(screen.getByText(/syncing your budgets/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/syncing your budgets/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Connect Your Bank Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect Bank" })).toBeInTheDocument();
    expect(screen.getByText("SmartBudget")).toBeInTheDocument();
    expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
  });

  it("shows connected state and loads bank data when persisted bundle has bankConnected", async () => {
    vi.mocked(financeSync.loadPersistedFinance).mockResolvedValue(
      baseBundle({ bankConnected: true })
    );

    render(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText("Bank Connected")).toBeInTheDocument();
    });

    expect(BankService.getAccounts).toHaveBeenCalled();
    expect(BankService.getTransactions).toHaveBeenCalled();
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
  });

  it("switches to Budgets panel when Budgets nav is clicked", async () => {
    const user = userEvent.setup();
    render(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.queryByText(/syncing your budgets/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /budgets/i }));
    expect(screen.getByText("Monthly budgets")).toBeInTheDocument();
  });

  it("switches to Transactions panel for expense logging", async () => {
    const user = userEvent.setup();
    render(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.queryByText(/syncing your budgets/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /transactions/i }));
    expect(screen.getByText("Log an expense")).toBeInTheDocument();
  });
});
