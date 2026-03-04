using Library_Service.DTOs;

namespace Library_Service.Services.Author;

public interface IAuthorService
{
    /// <summary>
    /// Retrieves a paginated list of all registered authors.
    /// </summary>
    /// <param name="page">The current page number.</param>
    /// <param name="size">The number of records per page.</param>
    /// <returns>A Result containing a collection of <see cref="AuthorGetDto"/>.</returns>
    Task<Result<IEnumerable<AuthorGetDto>>> GetAllAuthorsAsync(int page, int size);

    /// <summary>
    /// Retrieves detailed information about a specific author, including their books.
    /// </summary>
    /// <param name="id">The unique identifier of the author.</param>
    /// <returns> A Result containing <see cref="AuthorDetailGetDto"/> if found, otherwise, a failure result.</returns>
    Task<Result<AuthorDetailGetDto?>> GetAuthorByIdAsync(Guid id);

    /// <summary>
    /// Registers a new author in the system.
    /// </summary>
    /// <param name="author">The author data transfer object containing creation details.</param>
    /// <returns>A Result containing the newly created <see cref="AuthorDetailGetDto"/>.</returns>
    Task<Result<AuthorDetailGetDto>> CreateAuthorAsync(AuthorCreateDto author);

    /// <summary>
    /// Updates the information of an existing author.
    /// </summary>
    /// <param name="author">The author data transfer object containing updated data.</param>
    /// <returns>A Result containing the updated <see cref="AuthorDetailGetDto"/>.</returns>
    Task<Result<AuthorDetailGetDto>> UpdateAuthorAsync(AuthorUpdateDto author);
    
    /// <summary>
    /// Removes an author from the system.
    /// </summary>
    /// <remarks>
    /// Deletion should fail if the author has any books linked to their record to maintain referential integrity.
    /// </remarks>
    /// <param name="id">The unique identifier of the author to be deleted.</param>
    /// <returns>A Result indicating success (true) or a failure message.</returns>
    Task<Result<bool>> DeleteAuthorAsync(Guid id);
}