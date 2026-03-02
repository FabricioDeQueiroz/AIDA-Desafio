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
    [Required] [StringLength(300)] string Title,
    [Required] [StringLength(17)] string Isbn,
    [Required] short Year,
    [Required] int Quantity,
    [Required] Guid IdAuthor
);

public record BookUpdateDto(
    [Required] Guid IdBook,
    [Required] [StringLength(300)] string Title,
    [Required] [StringLength(17)] string Isbn,
    [Required] short Year,
    [Required] int Quantity,
    [Required] Guid IdAuthor
);