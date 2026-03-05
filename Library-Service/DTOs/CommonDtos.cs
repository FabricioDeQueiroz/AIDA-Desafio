using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Library_Service.DTOs;

public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int Size
)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)Size);
}