using Library_Service.DTOs;
using Library_Service.Services.Author;
using Microsoft.AspNetCore.Mvc;

namespace Library_Service.Controllers;

[ApiController]
[Route("author")]
public class AuthorController(IAuthorService authorService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<AuthorGetDto>>> GetAuthors(
        [FromQuery] int page = 1, [FromQuery] int size = 10
    )
    {
        var result = await authorService.GetAllAuthorsAsync(page, size);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthorDetailGetDto>> GetAuthorById(Guid id)
    {
        var result = await authorService.GetAuthorByIdAsync(id);

        if (!result.Success)
            return NotFound(result.Error);

        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthorDetailGetDto>> CreateAuthor([FromBody] AuthorCreateDto author)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await authorService.CreateAuthorAsync(author);

        if (!result.Success)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetAuthorById), new { id = result.Data!.IdAuthor }, result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AuthorDetailGetDto>> PutAuthor(Guid id, [FromBody] AuthorUpdateDto authorUpdateDto)
    {
        if (id != authorUpdateDto.IdAuthor)
        {
            return BadRequest("O ID na URL não corresponde ao ID no corpo da requisição.");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await authorService.UpdateAuthorAsync(authorUpdateDto);

        if (!result.Success)
        {
            return NotFound(result.Error);
        }

        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(string), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteAuthor(Guid id)
    {
        var result = await authorService.DeleteAuthorAsync(id);

        if (result.Success) return NoContent();

        if (result.Error!.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(result.Error);
        }

        if (result.Error!.Contains("possui livros vinculados", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(result.Error);
        }

        return BadRequest(result.Error);
    }
}