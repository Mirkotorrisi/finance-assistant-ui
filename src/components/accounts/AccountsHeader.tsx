interface AccountsHeaderProps {
  // Currently no props needed, but keeping for future extensibility
}

export function AccountsHeader(_props: AccountsHeaderProps) {
  return (
    <div className="sticky top-14 z-40 bg-background border-b">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
      </div>
    </div>
  );
}
