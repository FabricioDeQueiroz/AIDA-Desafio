using Microsoft.EntityFrameworkCore;

namespace Library_Service.Models.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Author> Authors { get; set; } = null!;
    public DbSet<Book> Books { get; set; } = null!;
    public DbSet<Loan> Loans { get; set; } = null!;

    #region Required

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Unique para ISBN
        builder.Entity<Book>()
            .HasIndex(b => b.Isbn)
            .IsUnique();

        // Author (1) : Books (N)
        builder.Entity<Book>()
            .HasOne(b => b.Author)
            .WithMany(a => a.Books)
            .HasForeignKey(b => b.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Book (1) : Loans (N)
        builder.Entity<Loan>()
            .HasOne(l => l.Book)
            .WithMany(b => b.Loans)
            .HasForeignKey(l => l.BookId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    #endregion

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e is { Entity: BaseEntity, State: EntityState.Added or EntityState.Modified });

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;
            var now = DateTime.UtcNow;

            entity.UpdatedAt = now;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = now;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}