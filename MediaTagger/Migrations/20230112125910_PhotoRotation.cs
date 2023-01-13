using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaTagger.Migrations
{
    public partial class PhotoRotation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "width",
                table: "MediaFile",
                newName: "Width");

            migrationBuilder.RenameColumn(
                name: "height",
                table: "MediaFile",
                newName: "Height");

            migrationBuilder.AddColumn<long>(
                name: "RotationDegrees",
                table: "MediaFile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RotationDegrees",
                table: "MediaFile");

            migrationBuilder.RenameColumn(
                name: "Width",
                table: "MediaFile",
                newName: "width");

            migrationBuilder.RenameColumn(
                name: "Height",
                table: "MediaFile",
                newName: "height");
        }
    }
}
