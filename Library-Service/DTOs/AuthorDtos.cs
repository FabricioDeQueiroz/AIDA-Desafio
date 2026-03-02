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
    [Required] [StringLength(150)] string Name,
    [DefaultValue("BR")] [StringLength(2)] string? Nationality
);

public record AuthorUpdateDto(
    [Required] Guid IdAuthor,
    [Required] [StringLength(150)] string Name,
    [StringLength(2)] string? Nationality
);