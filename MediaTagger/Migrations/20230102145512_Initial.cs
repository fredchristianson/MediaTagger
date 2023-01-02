using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaTagger.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Album",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Hidden = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Album", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Paths",
                columns: table => new
                {
                    PathId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Paths", x => x.PathId);
                });

            migrationBuilder.CreateTable(
                name: "Propertiess",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Hidden = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Propertiess", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PropertyValues",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<long>(type: "bigint", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Hidden = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyValues", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Setting",
                columns: table => new
                {
                    Scope = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Setting", x => new { x.Scope, x.Name });
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Hidden = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_Tags_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MediaFile",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FileModified = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FileCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateTaken = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FileSetPrimaryId = table.Column<long>(type: "bigint", nullable: true),
                    PathId = table.Column<int>(type: "int", nullable: true),
                    Filename = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ExifJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Hidden = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaFile", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MediaFile_Paths_PathId",
                        column: x => x.PathId,
                        principalTable: "Paths",
                        principalColumn: "PathId");
                });

            migrationBuilder.CreateTable(
                name: "AlbumModelMediaFileModel",
                columns: table => new
                {
                    AlbumsId = table.Column<long>(type: "bigint", nullable: false),
                    MediaFilesId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlbumModelMediaFileModel", x => new { x.AlbumsId, x.MediaFilesId });
                    table.ForeignKey(
                        name: "FK_AlbumModelMediaFileModel_Album_AlbumsId",
                        column: x => x.AlbumsId,
                        principalTable: "Album",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlbumModelMediaFileModel_MediaFile_MediaFilesId",
                        column: x => x.MediaFilesId,
                        principalTable: "MediaFile",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MediaFileModelPropertyValueModel",
                columns: table => new
                {
                    MediaFilesId = table.Column<long>(type: "bigint", nullable: false),
                    PropertiesId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaFileModelPropertyValueModel", x => new { x.MediaFilesId, x.PropertiesId });
                    table.ForeignKey(
                        name: "FK_MediaFileModelPropertyValueModel_MediaFile_MediaFilesId",
                        column: x => x.MediaFilesId,
                        principalTable: "MediaFile",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MediaFileModelPropertyValueModel_PropertyValues_PropertiesId",
                        column: x => x.PropertiesId,
                        principalTable: "PropertyValues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MediaFileModelTagModel",
                columns: table => new
                {
                    MediaFilesId = table.Column<long>(type: "bigint", nullable: false),
                    TagsId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaFileModelTagModel", x => new { x.MediaFilesId, x.TagsId });
                    table.ForeignKey(
                        name: "FK_MediaFileModelTagModel_MediaFile_MediaFilesId",
                        column: x => x.MediaFilesId,
                        principalTable: "MediaFile",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MediaFileModelTagModel_Tags_TagsId",
                        column: x => x.TagsId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlbumModelMediaFileModel_MediaFilesId",
                table: "AlbumModelMediaFileModel",
                column: "MediaFilesId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFile_PathId",
                table: "MediaFile",
                column: "PathId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFileModelPropertyValueModel_PropertiesId",
                table: "MediaFileModelPropertyValueModel",
                column: "PropertiesId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFileModelTagModel_TagsId",
                table: "MediaFileModelTagModel",
                column: "TagsId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ParentId",
                table: "Tags",
                column: "ParentId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlbumModelMediaFileModel");

            migrationBuilder.DropTable(
                name: "MediaFileModelPropertyValueModel");

            migrationBuilder.DropTable(
                name: "MediaFileModelTagModel");

            migrationBuilder.DropTable(
                name: "Propertiess");

            migrationBuilder.DropTable(
                name: "Setting");

            migrationBuilder.DropTable(
                name: "Album");

            migrationBuilder.DropTable(
                name: "PropertyValues");

            migrationBuilder.DropTable(
                name: "MediaFile");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Paths");
        }
    }
}
