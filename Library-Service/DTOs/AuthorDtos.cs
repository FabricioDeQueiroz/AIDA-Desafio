using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Library_Service.DTOs;

public record AuthorSummaryDto(
    Guid IdAuthor,
    string Name,
    string? Nationality
);

public record AuthorGetDto(
    Guid IdAuthor,
    string Name,
    string? Nationality,
    int BookCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AuthorDetailGetDto(
    Guid IdAuthor,
    string Name,
    string? Nationality,
    int BookCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    IEnumerable<BookSummaryDto> Books
);

public record AuthorCreateDto(
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome não pode exceder 150 caracteres.")]
    string Name,
    [DefaultValue("BR")]
    [StringLength(2, ErrorMessage = "A nacionalidade não pode exceder 2 caracteres.")]
    string? Nationality
);

public record AuthorUpdateDto(
    [Required(ErrorMessage = "O ID é obrigatório.")]
    Guid IdAuthor,
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome não pode exceder 150 caracteres.")]
    string Name,
    [StringLength(2, ErrorMessage = "A nacionalidade não pode exceder 2 caracteres.")]
    string? Nationality
);