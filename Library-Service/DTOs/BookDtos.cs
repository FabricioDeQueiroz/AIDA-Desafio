using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Library_Service.DTOs;

public record BookSummaryDto(
    Guid IdBook,
    string Title,
    short Year
);

public record BookGetDto(
    Guid IdBook,
    string Title,
    string Isbn,
    short Year,
    int Quantity,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    AuthorSummaryDto Author
);

public record BookCreateDto(
    [Required(ErrorMessage = "O título é obrigatório.")]
    [StringLength(300, MinimumLength = 3, ErrorMessage = "O título deve ter entre 3 e 300 caracteres.")]
    string Title,
    [Required(ErrorMessage = "O ISBN é obrigatório.")]
    [StringLength(13, MinimumLength = 13, ErrorMessage = "O ISBN deve ter 13 caracteres.")]
    string Isbn,
    [Required(ErrorMessage = "O ano é obrigatório.")]
    [Range(0, short.MaxValue, ErrorMessage = "O ano não pode ser um valor negativo.")]
    short Year,
    [Required(ErrorMessage = "A quantidade é obrigatória.")]
    [Range(0, int.MaxValue, ErrorMessage = "A quantidade não pode ser um valor negativo.")]
    int Quantity,
    [Required(ErrorMessage = "O ID do autor é obrigatório.")]
    Guid IdAuthor
);

public record BookUpdateDto(
    [Required(ErrorMessage = "O ID é obrigatório.")]
    Guid IdBook,
    [Required(ErrorMessage = "O título é obrigatório.")]
    [StringLength(300, MinimumLength = 3, ErrorMessage = "O título deve ter entre 3 e 300 caracteres.")]
    string Title,
    [Required(ErrorMessage = "O ISBN é obrigatório.")]
    [StringLength(13, MinimumLength = 13, ErrorMessage = "O ISBN deve ter 13 caracteres.")]
    string Isbn,
    [Required(ErrorMessage = "O ano é obrigatório.")]
    [Range(0, short.MaxValue, ErrorMessage = "O ano não pode ser um valor negativo.")]
    short Year,
    [Required(ErrorMessage = "A quantidade é obrigatória.")]
    [Range(0, int.MaxValue, ErrorMessage = "A quantidade não pode ser um valor negativo.")]
    int Quantity,
    [Required(ErrorMessage = "O ID do autor é obrigatório.")]
    Guid IdAuthor
);