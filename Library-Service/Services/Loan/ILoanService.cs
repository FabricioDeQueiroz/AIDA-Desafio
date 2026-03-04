using Library_Service.DTOs;
using Library_Service.Models;

namespace Library_Service.Services.Loan;

public interface ILoanService
{
    /// <summary>
    /// Retrieves a paginated list of all loans, with an optional filter by status.
    /// </summary>
    /// <param name="status">Optional status filter (e.g., Active, Returned).</param>
    /// <param name="page">The current page number.</param>
    /// <param name="size">The number of records per page.</param>
    /// <returns>A Result containing a paginated collection of <see cref="LoanGetDto"/>.</returns>
    Task<Result<PagedResult<LoanGetDto>>> GetAllLoansAsync(Status? status, int page, int size);

    /// <summary>
    /// Retrieves detailed information about a specific Loan.
    /// </summary>
    /// <param name="id">The unique identifier of the loan.</param>
    /// <returns> A Result containing <see cref="LoanDetailGetDto"/> if found, otherwise, a failure result.</returns>
    Task<Result<LoanDetailGetDto?>> GetLoanByIdAsync(Guid id);

    /// <summary>
    /// Registers a new loan in the system.
    /// </summary>
    /// <param name="loan">The loan data transfer object containing creation details.</param>
    /// <returns>A Result containing the newly created <see cref="LoanDetailGetDto"/>.</returns>
    Task<Result<LoanDetailGetDto>> CreateLoanAsync(LoanCreateDto loan);

    /// <summary>
    /// Updates the status of a loan to "Returned".
    /// </summary>
    /// <param name="id">The unique identifier of the loan.</param>
    /// <returns>A Result containing the updated <see cref="LoanDetailGetDto"/>.</returns>
    Task<Result<LoanDetailGetDto>> UpdateLoanAsync(Guid id);
}