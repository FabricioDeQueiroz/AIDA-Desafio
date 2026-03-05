using Library_Service.DTOs;
using Library_Service.Models;
using Library_Service.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Library_Service.Services.Book;

public class BookService(AppDbContext context) : IBookService
{
    private readonly AppDbContext _context = context;

    public async Task<Result<PagedResult<BookGetDto>>> GetAllBooksAsync(int page, int size)
    {
        try
        {
            // Basic validation
            if (page <= 0) page = 1;
            if (size <= 0) size = 10;

            var query = _context.Books.AsNoTracking();
            
            var totalCount = await query.CountAsync();

            // Books paginated query 
            var books = await query
                .OrderBy(a => a.Title)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(b => new BookGetDto(
                    b.Id,
                    b.Title,
                    b.Isbn,
                    b.Year,
                    b.Quantity,
                    b.CreatedAt,
                    b.UpdatedAt,
                    new AuthorSummaryDto(
                        b.Author.Id,
                        b.Author.Name,
                        b.Author.Nationality
                    )
                ))
                .ToListAsync();
            
            var result = new PagedResult<BookGetDto>(books, totalCount, page, size);
            
            return Result<PagedResult<BookGetDto>>.Ok(result);
        }
        catch (Exception)
        {
            return Result<PagedResult<BookGetDto>>.Failure("Ocorreu um erro ao recuperar os livros.");
        }
    }

    public async Task<Result<BookGetDto?>> GetBookByIdAsync(Guid id)
    {
        try
        {
            var query = _context.Books.AsNoTracking();

            var book = await query
                .Where(b => b.Id == id)
                .Select(b => new BookGetDto(
                    b.Id,
                    b.Title,
                    b.Isbn,
                    b.Year,
                    b.Quantity,
                    b.CreatedAt,
                    b.UpdatedAt,
                    new AuthorSummaryDto(
                        b.Author.Id,
                        b.Author.Name,
                        b.Author.Nationality
                    )
                ))
                .FirstOrDefaultAsync();

            return book == null
                ? Result<BookGetDto?>.Failure("Livro não encontrado.")
                : Result<BookGetDto?>.Ok(book);
        }
        catch (Exception)
        {
            return Result<BookGetDto?>.Failure("Ocorreu um erro ao recuperar o livro.");
        }
    }

    public async Task<Result<IEnumerable<BookGetDto>>> SearchBooksAsync(string? title, string? isbn)
    {
        try
        {
            var query = _context.Books.AsNoTracking();

            // Filters
            if (!string.IsNullOrWhiteSpace(title))
                query = query.Where(b => b.Title.ToLower().Contains(title.ToLower()));

            if (!string.IsNullOrWhiteSpace(isbn))
                query = query.Where(b => b.Isbn.Contains(isbn));

            var books = await query
                .OrderBy(b => b.Title)
                .Select(b => new BookGetDto(
                    b.Id,
                    b.Title,
                    b.Isbn,
                    b.Year,
                    b.Quantity,
                    b.CreatedAt,
                    b.UpdatedAt,
                    new AuthorSummaryDto(
                        b.Author.Id,
                        b.Author.Name,
                        b.Author.Nationality
                    )
                ))
                .ToListAsync();

            return Result<IEnumerable<BookGetDto>>.Ok(books);
        }
        catch (Exception)
        {
            return Result<IEnumerable<BookGetDto>>.Failure("Ocorreu um erro ao procurar os livros.");
        }
    }

    public async Task<Result<BookGetDto>> CreateBookAsync(BookCreateDto bookDto)
    {
        try
        {
            var author = await _context.Authors.FindAsync(bookDto.IdAuthor);

            if (author == null)
            {
                return Result<BookGetDto>.Failure("O autor informado não existe.");
            }

            var isbnExists = await _context.Books.AnyAsync(b => b.Isbn == bookDto.Isbn);

            if (isbnExists)
            {
                return Result<BookGetDto>.Failure("O ISBN fornecido já está registrado em outro livro.");
            }

            var book = new Models.Book
            {
                Title = bookDto.Title,
                Isbn = bookDto.Isbn,
                Year = bookDto.Year,
                Quantity = bookDto.Quantity,
                AuthorId = bookDto.IdAuthor,
                Author = author
            };

            _context.Books.Add(book);

            await _context.SaveChangesAsync();

            var response = new BookGetDto(
                book.Id,
                book.Title,
                book.Isbn,
                book.Year,
                book.Quantity,
                book.CreatedAt,
                book.UpdatedAt,
                new AuthorSummaryDto(
                    author.Id,
                    author.Name,
                    author.Nationality
                )
            );

            return Result<BookGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<BookGetDto>.Failure("Ocorreu um erro ao registrar o livro.");
        }
    }

    public async Task<Result<BookGetDto>> UpdateBookAsync(BookUpdateDto bookDto)
    {
        try
        {
            var book = await _context.Books
                .Include(b => b.Author)
                .FirstOrDefaultAsync(b => b.Id == bookDto.IdBook);

            if (book == null)
            {
                return Result<BookGetDto>.Failure("Livro não encontrado.");
            }

            var isbnExists = await _context.Books
                .AnyAsync(b => b.Isbn == bookDto.Isbn && b.Id != bookDto.IdBook);

            if (isbnExists)
            {
                return Result<BookGetDto>.Failure("O ISBN fornecido já está registrado em outro livro.");
            }

            if (book.AuthorId != bookDto.IdAuthor)
            {
                var newAuthor = await _context.Authors.FindAsync(bookDto.IdAuthor);
                if (newAuthor == null) return Result<BookGetDto>.Failure("O novo autor informado não existe.");

                book.Author = newAuthor;
            }

            book.Title = bookDto.Title;
            book.Isbn = bookDto.Isbn;
            book.Year = bookDto.Year;
            book.Quantity = bookDto.Quantity;

            await _context.SaveChangesAsync();

            var response = new BookGetDto(
                book.Id,
                book.Title,
                book.Isbn,
                book.Year,
                book.Quantity,
                book.CreatedAt,
                book.UpdatedAt,
                new AuthorSummaryDto(
                    book.Author.Id,
                    book.Author.Name,
                    book.Author.Nationality
                )
            );

            return Result<BookGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<BookGetDto>.Failure("Ocorreu um erro ao atualizar os dados do livro.");
        }
    }

    public async Task<Result<bool>> DeleteBookAsync(Guid id)
    {
        try
        {
            var book = await _context.Books
                .FindAsync(id);

            if (book == null)
            {
                return Result<bool>.Failure("Livro não encontrado.");
            }

            var hasLoans = await _context.Loans.AnyAsync(l => l.BookId == id);

            if (hasLoans)
            {
                return Result<bool>.Failure(
                    "Não é possível excluir o livro porque ele possui empréstimos vinculados ao seu registro.");
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return Result<bool>.Ok(true);
        }
        catch (Exception)
        {
            return Result<bool>.Failure("Ocorreu um erro ao deletar o registro do livro.");
        }
    }
}