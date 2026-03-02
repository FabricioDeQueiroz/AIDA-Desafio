using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

[Table("Author")]
public class Author
{
    [Key] [Column("id")] public Guid Id { get; init; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome não pode exceder 150 caracteres.")]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [StringLength(2, ErrorMessage = "A nacionalidade não pode exceder 2 caracteres.")]
    [Column("nationality")]
    public string Nationality { get; set; } = string.Empty;
}