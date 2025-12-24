interface CreditBalanceProps {
  balance: number;
  graceCreditsUsed: number;
}

export function CreditBalance({ balance, graceCreditsUsed }: CreditBalanceProps) {
  // Format credits (cents to dollars)
  const formatCredits = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Balance</h3>

      {/* Current Balance */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Current Balance</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatCredits(balance)}
        </p>
      </div>

      {/* Grace Credits Warning */}
      {graceCreditsUsed > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Grace Credits Used
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have used {formatCredits(graceCreditsUsed)} in grace credits.
                  Please purchase more credits to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits Button */}
      <button
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => {
          // Placeholder for future credit purchase flow
          alert('Credit purchase coming soon!');
        }}
      >
        Buy Credits
      </button>
    </div>
  );
}
