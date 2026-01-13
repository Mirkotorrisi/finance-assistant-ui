# Services

This directory contains service modules for interacting with the backend API.

## Configuration

The API base URL is configured through environment variables. Create a `.env` file in the root of the project (copy from `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Available Services

### financialDataService

Service for fetching financial data from the backend.

**Methods:**

- `getFinancialData(year: number)`: Fetch financial data for a specific year
- `getCurrentFinancialData()`: Fetch financial data for the current year

**Example:**

```typescript
import { financialDataService } from '@/services';

// Fetch current year data
const data = await financialDataService.getCurrentFinancialData();

// Fetch specific year data
const data2024 = await financialDataService.getFinancialData(2024);
```

### apiClient

Low-level HTTP client for making custom API requests.

**Methods:**

- `get<T>(endpoint: string)`: Make a GET request
- `post<T, D>(endpoint: string, data?: D)`: Make a POST request
- `put<T, D>(endpoint: string, data?: D)`: Make a PUT request
- `delete<T>(endpoint: string)`: Make a DELETE request

**Example:**

```typescript
import { apiClient } from '@/services';

// Custom GET request
const response = await apiClient.get<CustomType>('/api/custom-endpoint');
```

## Error Handling

All service methods throw errors that should be caught and handled appropriately:

```typescript
try {
  const data = await financialDataService.getCurrentFinancialData();
  // Use data
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Handle error (e.g., show error message, use fallback data)
}
```
