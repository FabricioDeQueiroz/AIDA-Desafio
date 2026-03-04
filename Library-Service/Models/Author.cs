using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

[Table("Author")]
public class Author : BaseEntity
{
    [Key] [Column("id")] public Guid Id { get; init; } = Guid.NewGuid();

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "O nome deve ter entre 3 e 150 caracteres.")]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [StringLength(2, MinimumLength = 2, ErrorMessage = "A nacionalidade deve ter 2 caracteres.")]
    [Column("nationality")]
    public string? Nationality { get; set; } = string.Empty;

    public ICollection<Book> Books { get; set; } = new List<Book>();
}