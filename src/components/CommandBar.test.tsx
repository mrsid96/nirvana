import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CommandBar } from '@/components/CommandBar'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { currency: 'INR' } }),
}))

vi.mock('@/lib/command-bar/executor', () => ({
  executeConfirmedIntent: vi.fn().mockResolvedValue(undefined),
}))

const mockFinance = {
  goals: [{ id: 'g1', name: 'Retirement', targetAmount: 10000000, isDeleted: false }],
  assets: [
    {
      id: 'a1',
      name: 'HDFC Flexi Cap',
      goalId: 'g1',
      isDeleted: false,
      currentValue: 1000000,
    },
  ],
  loans: [{ id: 'l1', name: 'Home Loan', isDeleted: false, outstandingAmount: 5000000 }],
  income: [],
  expenses: [],
  transactions: [],
  loanPayments: [],
  scheduledOccurrences: [],
  ensureRecurringActivities: vi.fn().mockResolvedValue(undefined),
  addGoal: vi.fn(),
  addAsset: vi.fn(),
  addLoan: vi.fn(),
  addExpense: vi.fn(),
  addIncome: vi.fn(),
  addTransaction: vi.fn(),
  addLoanPayment: vi.fn(),
  addRecurringActivity: vi.fn(),
  skipOccurrence: vi.fn(),
}

vi.mock('@/contexts/FinanceContext', () => ({
  useFinance: () => mockFinance,
}))

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    supported: true,
    listening: false,
    interimTranscript: '',
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

function renderBar() {
  return render(
    <MemoryRouter>
      <CommandBar contextKey="home" />
    </MemoryRouter>,
  )
}

function openCommandInput(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByTestId('command-bar-open'))
}

describe('CommandBar UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders closed state with home placeholder', () => {
    renderBar()
    expect(screen.getByText('What happened with your money?')).toBeInTheDocument()
    expect(screen.getByTestId('command-bar-open')).toBeInTheDocument()
  })

  it('shows voice button when speech is supported', () => {
    renderBar()
    expect(screen.getByLabelText(/speak a money command/i)).toBeInTheDocument()
  })

  it('expands to text input on click', async () => {
    const user = userEvent.setup()
    renderBar()
    await openCommandInput(user)
    expect(screen.getByLabelText(/natural language money command/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start voice input/i)).toBeInTheDocument()
  })

  it('shows confirmation for expense command', async () => {
    const user = userEvent.setup()
    renderBar()
    await openCommandInput(user)
    const input = screen.getByLabelText(/natural language money command/i)
    await user.type(input, 'Spent 500 on groceries')
    await user.click(screen.getByLabelText(/submit command/i))
    expect(await screen.findByText(/i understood this as/i)).toBeInTheDocument()
    expect(screen.getByText('Expense')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('shows rich create form for create goal intent', async () => {
    const user = userEvent.setup()
    renderBar()
    await openCommandInput(user)
    const input = screen.getByLabelText(/natural language money command/i)
    await user.type(input, 'Create retirement goal 50 lakh')
    await user.click(screen.getByLabelText(/submit command/i))
    expect(await screen.findByLabelText(/goal name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
  })
})
