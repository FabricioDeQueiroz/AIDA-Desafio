using Library_Service.Models.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace Library_Service.Tests;

using Microsoft.AspNetCore.Mvc.Testing;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public CustomWebApplicationFactory()
    {
        var defaultConnection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        var allowedOrigins = Environment.GetEnvironmentVariable("Cors__AllowedOrigins");

        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", defaultConnection);
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins", allowedOrigins);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var defaultConnection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        var allowedOrigins = Environment.GetEnvironmentVariable("Cors__AllowedOrigins");

        builder.UseContentRoot(Directory.GetCurrentDirectory());
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = defaultConnection,
                ["Cors:AllowedOrigins"] = allowedOrigins
            });
        });
    }

    public AppDbContext CreateDbContext()
    {
        var scopeFactory = Services.GetRequiredService<IServiceScopeFactory>();
        var scope = scopeFactory.CreateScope();
        return scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }
}