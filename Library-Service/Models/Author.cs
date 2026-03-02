using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

[Table("Author")]
public class Author : BaseEntity
{
    [Key] [Column("id")] public Guid Id { get; init; } = Guid.NewGuid();

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome não pode exceder 150 caracteres.")]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [StringLength(2, ErrorMessage = "A nacionalidade não pode exceder 2 caracteres.")]
    [Column("nationality")]
    public string Nationality { get; set; } = string.Empty;

    public ICollection<Book> Books { get; set; } = new List<Book>();
}