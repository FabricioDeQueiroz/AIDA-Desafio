using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

[Table("Book")]
public class Book : BaseEntity
{
    [Key] [Column("id")] public Guid Id { get; init; } = Guid.NewGuid();

    [Required(ErrorMessage = "O título é obrigatório.")]
    [StringLength(300, ErrorMessage = "O título não pode exceder 300 caracteres.")]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "O ISBN é obrigatório.")]
    [StringLength(17, ErrorMessage = "O ISBN não pode exceder 17 caracteres.")]
    [Column("isbn")]
    public string Isbn { get; set; } = string.Empty;

    [Required(ErrorMessage = "O ano é obrigatório.")]
    [Range(0, short.MaxValue, ErrorMessage = "O ano não pode ser um valor negativo.")]
    [Column("year", TypeName = "smallint")]
    public short Year { get; set; }

    [Required(ErrorMessage = "A quantidade é obrigatória.")]
    [Range(0, int.MaxValue, ErrorMessage = "A quantidade não pode ser um valor negativo.")]
    [Column("quantity")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "O autor é obrigatório.")]
    [Column("authorId")]
    public Guid AuthorId { get; set; }

    [ForeignKey("AuthorId")] public Author Author { get; set; } = null!;

    public ICollection<Loan> Loans { get; set; } = new List<Loan>();
}