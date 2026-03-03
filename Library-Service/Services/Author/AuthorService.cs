using Library_Service.DTOs;
using Library_Service.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Library_Service.Services.Author;

public class AuthorService(AppDbContext context) : IAuthorService
{
    private readonly AppDbContext _context = context;

    public async Task<Result<IEnumerable<AuthorGetDto>>> GetAllAuthorsAsync(int page, int size)
    {
        try
        {
            // Basic validation
            if (page <= 0) page = 1;
            if (size <= 0) size = 10;

            var query = _context.Authors.AsNoTracking();

            // Authors paginated query 
            var authors = await query
                .OrderBy(a => a.Name)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(a => new AuthorGetDto(
                    a.Id,
                    a.Name,
                    a.Nationality,
                    a.Books.Count,
                    a.CreatedAt,
                    a.UpdatedAt
                ))
                .ToListAsync();

            return Result<IEnumerable<AuthorGetDto>>.Ok(authors);
        }
        catch (Exception)
        {
            return Result<IEnumerable<AuthorGetDto>>.Failure("Ocorreu um erro ao recuperar os autores.");
        }
    }

    public async Task<Result<AuthorDetailGetDto?>> GetAuthorByIdAsync(Guid id)
    {
        try
        {
            var query = _context.Authors.AsNoTracking();

            var author = await query
                .Include(a => a.Books)
                .Where(a => a.Id == id)
                .Select(a => new AuthorDetailGetDto(
                    a.Id,
                    a.Name,
                    a.Nationality,
                    a.Books.Count,
                    a.CreatedAt,
                    a.UpdatedAt,
                    a.Books.Select(b => new BookSummaryDto(
                        b.Id,
                        b.Title,
                        b.Year
                    )).ToList()
                ))
                .FirstOrDefaultAsync();

            return author == null
                ? Result<AuthorDetailGetDto?>.Failure("Autor não encontrado.")
                : Result<AuthorDetailGetDto?>.Ok(author);
        }
        catch (Exception)
        {
            return Result<AuthorDetailGetDto?>.Failure("Ocorreu um erro ao recuperar o autor.");
        }
    }

    public async Task<Result<AuthorDetailGetDto>> CreateAuthorAsync(AuthorCreateDto authorDto)
    {
        try
        {
            var author = new Models.Author
            {
                Name = authorDto.Name,
                Nationality = authorDto.Nationality
            };

            _context.Authors.Add(author);

            await _context.SaveChangesAsync();

            var response = new AuthorDetailGetDto(
                author.Id,
                author.Name,
                author.Nationality,
                0,
                author.CreatedAt,
                author.UpdatedAt,
                new List<BookSummaryDto>()
            );

            return Result<AuthorDetailGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<AuthorDetailGetDto>.Failure("Ocorreu um erro ao registrar o autor.");
        }
    }

    public async Task<Result<AuthorDetailGetDto>> UpdateAuthorAsync(AuthorUpdateDto authorDto)
    {
        try
        {
            var author = await _context.Authors
                .Include(a => a.Books)
                .FirstOrDefaultAsync(a => a.Id == authorDto.IdAuthor);

            if (author == null)
            {
                return Result<AuthorDetailGetDto>.Failure("Autor não encontrado.");
            }

            author.Name = authorDto.Name;
            author.Nationality = authorDto.Nationality;

            await _context.SaveChangesAsync();

            var response = new AuthorDetailGetDto(
                author.Id,
                author.Name,
                author.Nationality,
                author.Books.Count,
                author.CreatedAt,
                author.UpdatedAt,
                author.Books.Select(b => new BookSummaryDto(b.Id, b.Title, b.Year)).ToList()
            );

            return Result<AuthorDetailGetDto>.Ok(response);
        }
        catch (Exception)
        {
            return Result<AuthorDetailGetDto>.Failure("Ocorreu um erro ao atualizar os dados do autor.");
        }
    }

    public async Task<Result<bool>> DeleteAuthorAsync(Guid id)
    {
        try
        {
            var author = await _context.Authors
                .Include(a => a.Books)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (author == null)
            {
                return Result<bool>.Failure("Autor não encontrado.");
            }

            if (author.Books.Count != 0)
            {
                return Result<bool>.Failure(
                    "Não é possível excluir o autor porque ele possui livros vinculados ao seu registro.");
            }

            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();

            return Result<bool>.Ok(true);
        }
        catch (Exception)
        {
            return Result<bool>.Failure("Ocorreu um erro ao deletar o registro do autor.");
        }
    }
}