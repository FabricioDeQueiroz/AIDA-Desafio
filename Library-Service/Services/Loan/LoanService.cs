using Library_Service.DTOs;
using Library_Service.Models;
using Library_Service.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Library_Service.Services.Loan;

public class LoanService(AppDbContext context) : ILoanService
{
    private readonly AppDbContext _context = context;

    public async Task<Result<IEnumerable<LoanGetDto>>> GetAllLoansAsync(Status? status, int page, int size)
    {
        try
        {
            // Basic validation
            if (page <= 0) page = 1;
            if (size <= 0) size = 10;

            var query = _context.Loans.AsNoTracking();

            // Optional filter for status
            if (status.HasValue)
                query = query.Where(l => l.Status == status.Value);

            // Loans paginated query 
            var loans = await query
                .OrderBy(l => l.LoanDate)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(l => new LoanGetDto(
                    l.Id,
                    l.BorrowerName,
                    l.LoanDate,
                    l.ReturnDate,
                    l.Status,
                    l.CreatedAt,
                    l.UpdatedAt,
                    l.Book.Title
                ))
                .ToListAsync();

            return Result<IEnumerable<LoanGetDto>>.Ok(loans);
        }
        catch (Exception)
        {
            return Result<IEnumerable<LoanGetDto>>.Failure("Ocorreu um erro ao recuperar os empréstimos.");
        }
    }

    public async Task<Result<LoanDetailGetDto?>> GetLoanByIdAsync(Guid id)
    {
        try
        {
            var query = _context.Loans.AsNoTracking();

            var loan = await query
                .Where(l => l.Id == id)
                .Select(l => new LoanDetailGetDto(
                    l.Id,
                    l.BorrowerName,
                    l.LoanDate,
                    l.ReturnDate,
                    l.Status,
                    l.CreatedAt,
                    l.UpdatedAt,
                    new BookSummaryDto(
                        l.Book.Id,
                        l.Book.Title,
                        l.Book.Year
                    )
                ))
                .FirstOrDefaultAsync();

            return loan == null
                ? Result<LoanDetailGetDto?>.Failure("Empréstimo não encontrado.")
                : Result<LoanDetailGetDto?>.Ok(loan);
        }
        catch (Exception)
        {
            return Result<LoanDetailGetDto?>.Failure("Ocorreu um erro ao recuperar o empréstimo.");
        }
    }

    public async Task<Result<LoanDetailGetDto>> CreateLoanAsync(LoanCreateDto loanDto)
    {
        try
        {
            var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == loanDto.BookId);
            
            if (book == null)
                return Result<LoanDetailGetDto>.Failure("O livro informado não existe.");
            
            // Verify quantity
            if (book.Quantity <= 0)
                return Result<LoanDetailGetDto>.Failure("Não há exemplares disponíveis para empréstimo.");

            // Decrease quantity
            book.Quantity--;
            
            var loan = new Models.Loan
            {
                BorrowerName = loanDto.BorrowerName,
                LoanDate = DateTime.UtcNow,
                Status = Status.Active,
                BookId = loanDto.BookId,
                Book = book
            };

            _context.Loans.Add(loan);

            await _context.SaveChangesAsync();

            var response = new LoanDetailGetDto(
                loan.Id,
                loan.BorrowerName,
                loan.LoanDate,
                loan.ReturnDate,
                loan.Status,
                loan.CreatedAt,
                loan.UpdatedAt,
                new BookSummaryDto(
                    book.Id,
                    book.Title,
                    book.Year
                )
            );

            return Result<LoanDetailGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<LoanDetailGetDto>.Failure("Ocorreu um erro ao registrar o empréstimo.");
        }
    }

    public async Task<Result<LoanDetailGetDto>> UpdateLoanAsync(Guid id)
    {
        try
        {
            var loan = await _context.Loans
                .Include(l => l.Book)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (loan == null)
                return Result<LoanDetailGetDto>.Failure("Empréstimo não encontrado.");
            
            
            if (loan.Status == Status.Returned)
                return Result<LoanDetailGetDto>.Failure("Este empréstimo já foi devolvido.");
            
            loan.Status = Status.Returned;
            loan.ReturnDate = DateTime.UtcNow;
            loan.Book.Quantity++;
            
            await _context.SaveChangesAsync();

            var response = new LoanDetailGetDto(
                loan.Id,
                loan.BorrowerName,
                loan.LoanDate,
                loan.ReturnDate,
                loan.Status,
                loan.CreatedAt,
                loan.UpdatedAt,
                new BookSummaryDto(
                    loan.Book.Id,
                    loan.Book.Title,
                    loan.Book.Year
                )
            );

            return Result<LoanDetailGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<LoanDetailGetDto>.Failure("Ocorreu um erro ao registrar a devolução do empréstimo.");
        }
    }
}