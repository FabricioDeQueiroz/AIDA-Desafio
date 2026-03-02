using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

public enum Status
{
    Active = 1,
    Returned = 2
}

[Table("Loan")]
public class Loan : BaseEntity
{
    [Key] [Column("id")] public Guid Id { get; init; } = Guid.NewGuid();

    [Required(ErrorMessage = "O nome do locatário é obrigatório.")]
    [StringLength(150, ErrorMessage = "O nome do locatário não pode exceder 150 caracteres.")]
    [Column("borrower_name")]
    public string BorrowerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "A data e hora do empréstimo são obrigatórias.")]
    [Column("loan_date")]
    public DateTime LoanDate { get; set; }

    [Column("return_date")] public DateTime? ReturnDate { get; set; }

    [Column("status")]
    [EnumDataType(typeof(Status))]
    public Status Status { get; set; } = Status.Active;

    [Required(ErrorMessage = "O livro é obrigatório.")]
    [Column("bookId")]
    public Guid BookId { get; set; }

    [ForeignKey("BookId")] public Book Book { get; set; } = null!;
}