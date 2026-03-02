using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Service.Models;

public abstract class BaseEntity
{
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}