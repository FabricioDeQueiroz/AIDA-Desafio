using Library_Service.DTOs;
using Library_Service.Models;
using Library_Service.Services.Loan;
using Microsoft.AspNetCore.Mvc;

namespace Library_Service.Controllers;

[ApiController]
[Route("loan")]
public class LoanController(ILoanService loanService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<LoanGetDto>>> GetLoans(
        [FromQuery] Status? status, [FromQuery] int page = 1, [FromQuery] int size = 10
    )
    {
        var result = await loanService.GetAllLoansAsync(status, page, size);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoanDetailGetDto>> GetLoanById(Guid id)
    {
        var result = await loanService.GetLoanByIdAsync(id);

        if (!result.Success)
            return NotFound(result.Error);

        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoanDetailGetDto>> CreateLoan([FromBody] LoanCreateDto loan)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await loanService.CreateLoanAsync(loan);

        if (!result.Success)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetLoanById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(string), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoanDetailGetDto>> PutLoan(Guid id)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await loanService.UpdateLoanAsync(id);

        if (!result.Success)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Data);
    }
}