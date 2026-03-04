using Library_Service.DTOs;

namespace Library_Service.Services.Book;

public interface IBookService
{
    /// <summary>
    /// Retrieves a paginated list of all registered books.
    /// </summary>
    /// <param name="page">The current page number.</param>
    /// <param name="size">The number of records per page.</param>
    /// <returns>A Result containing a collection of <see cref="BookGetDto"/>.</returns>
    Task<Result<IEnumerable<BookGetDto>>> GetAllBooksAsync(int page, int size);

    /// <summary>
    /// Retrieves detailed information about a specific book, including their author.
    /// </summary>
    /// <param name="id">The unique identifier of the book.</param>
    /// <returns> A Result containing <see cref="BookGetDto"/> if found, otherwise, a failure result.</returns>
    Task<Result<BookGetDto?>> GetBookByIdAsync(Guid id);
    
    /// <summary>
    /// Searches for books based on title, ISBN, or both.
    /// </summary>
    /// <param name="title">Optional book title or part of it.</param>
    /// <param name="isbn">Optional ISBN to search for.</param>
    /// <returns>A Result containing a list of books that match the criteria.</returns>
    Task<Result<IEnumerable<BookGetDto>>> SearchBooksAsync(string? title, string? isbn);

    /// <summary>
    /// Registers a new book in the system.
    /// </summary>
    /// <param name="book">The book data transfer object containing creation details.</param>
    /// <returns>A Result containing the newly created <see cref="BookGetDto"/>.</returns>
    Task<Result<BookGetDto>> CreateBookAsync(BookCreateDto book);

    /// <summary>
    /// Updates the information of an existing book.
    /// </summary>
    /// <param name="book">The book data transfer object containing updated data.</param>
    /// <returns>A Result containing the updated <see cref="BookGetDto"/>.</returns>
    Task<Result<BookGetDto>> UpdateBookAsync(BookUpdateDto book);
    
    /// <summary>
    /// Removes a book from the system.
    /// </summary>
    /// <remarks>
    /// Deletion should fail if the book has any loans linked to their record to maintain referential integrity.
    /// </remarks>
    /// <param name="id">The unique identifier of the book to be deleted.</param>
    /// <returns>A Result indicating success (true) or a failure message.</returns>
    Task<Result<bool>> DeleteBookAsync(Guid id);
}