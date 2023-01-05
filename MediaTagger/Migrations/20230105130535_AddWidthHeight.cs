using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaTagger.Migrations
{
    public partial class AddWidthHeight : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "height",
                table: "MediaFile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "width",
                table: "MediaFile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "height",
                table: "MediaFile");

            migrationBuilder.DropColumn(
                name: "width",
                table: "MediaFile");
        }
    }
}
