using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Library_Service.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Author",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    nationality = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Author", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Book",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    isbn = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: false),
                    year = table.Column<short>(type: "smallint", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    authorId = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Book", x => x.id);
                    table.ForeignKey(
                        name: "FK_Book_Author_authorId",
                        column: x => x.authorId,
                        principalTable: "Author",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Loan",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    borrower_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    loan_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    return_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    bookId = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loan", x => x.id);
                    table.ForeignKey(
                        name: "FK_Loan_Book_bookId",
                        column: x => x.bookId,
                        principalTable: "Book",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Book_authorId",
                table: "Book",
                column: "authorId");

            migrationBuilder.CreateIndex(
                name: "IX_Book_isbn",
                table: "Book",
                column: "isbn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Loan_bookId",
                table: "Loan",
                column: "bookId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Loan");

            migrationBuilder.DropTable(
                name: "Book");

            migrationBuilder.DropTable(
                name: "Author");
        }
    }
}
