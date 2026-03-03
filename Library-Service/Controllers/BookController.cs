using Library_Service.DTOs;
using Library_Service.Services.Book;
using Microsoft.AspNetCore.Mvc;

namespace Library_Service.Controllers;

[ApiController]
[Route("[controller]")]
public class BookController(IBookService bookService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<BookGetDto>>> GetBooks(
        [FromQuery] int page = 1, [FromQuery] int size = 10
    )
    {
        var result = await bookService.GetAllBooksAsync(page, size);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(result.Data);
    }

    // TODO ver ser o "?" fez alguma diferença com o GetById de Author
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookGetDto?>> GetBookById(Guid id)
    {
        var result = await bookService.GetBookByIdAsync(id);

        if (!result.Success)
            return NotFound(result.Error);

        return Ok(result.Data);
    }
    
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookGetDto?>> GetBookByIsbnOrTitle(
        [FromQuery] string? title, [FromQuery] string? isbn
    )
    {
        var result = await bookService.SearchBooksAsync(title, isbn);

        if (!result.Success)
            return NotFound(result.Error);

        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookGetDto>> CreateBook([FromBody] BookCreateDto book)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await bookService.CreateBookAsync(book);

        if (!result.Success)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetBookById), new { id = result.Data!.IdBook }, result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookGetDto>> PutBook(Guid id, [FromBody] BookUpdateDto bookUpdateDto)
    {
        if (id != bookUpdateDto.IdBook)
        {
            return BadRequest("O ID na URL não corresponde ao ID no corpo da requisição.");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await bookService.UpdateBookAsync(bookUpdateDto);

        if (!result.Success)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(string), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteBook(Guid id)
    {
        var result = await bookService.DeleteBookAsync(id);

        if (result.Success) return NoContent();

        if (result.Error!.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result.Error);
        }

        if (result.Error!.Contains("possui empréstimos vinculados", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(result.Error);
        }

        return BadRequest(result.Error);
    }
}