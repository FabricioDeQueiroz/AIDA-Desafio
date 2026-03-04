using System.ComponentModel.DataAnnotations;
using Library_Service.Models;

namespace Library_Service.DTOs;

public record LoanGetDto(
    Guid Id,
    string BorrowerName,
    DateTime LoanDate,
    DateTime? ReturnDate,
    Status Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string BookTitle
);

public record LoanDetailGetDto(
    Guid Id,
    string BorrowerName,
    DateTime LoanDate,
    DateTime? ReturnDate,
    Status Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    BookSummaryDto Book
);

public record LoanCreateDto(
    [Required(ErrorMessage = "O nome do locatário é obrigatório.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "O nome do locatário deve ter entre 3 e 150 caracteres.")]
    string BorrowerName,
    [Required(ErrorMessage = "O ID do livro é obrigatório.")]
    Guid BookId
);