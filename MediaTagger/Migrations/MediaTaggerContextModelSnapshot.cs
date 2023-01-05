﻿// <auto-generated />
using System;
using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace MediaTagger.Migrations
{
    [DbContext(typeof(MediaTaggerContext))]
    partial class MediaTaggerContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.10")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder, 1L, 1);

            modelBuilder.Entity("AlbumModelMediaFileModel", b =>
                {
                    b.Property<long>("AlbumsId")
                        .HasColumnType("bigint");

                    b.Property<long>("MediaFilesId")
                        .HasColumnType("bigint");

                    b.HasKey("AlbumsId", "MediaFilesId");

                    b.HasIndex("MediaFilesId");

                    b.ToTable("AlbumModelMediaFileModel");
                });

            modelBuilder.Entity("MediaFileModelPropertyValueModel", b =>
                {
                    b.Property<long>("MediaFilesId")
                        .HasColumnType("bigint");

                    b.Property<long>("PropertiesId")
                        .HasColumnType("bigint");

                    b.HasKey("MediaFilesId", "PropertiesId");

                    b.HasIndex("PropertiesId");

                    b.ToTable("MediaFileModelPropertyValueModel");
                });

            modelBuilder.Entity("MediaFileModelTagModel", b =>
                {
                    b.Property<long>("MediaFilesId")
                        .HasColumnType("bigint");

                    b.Property<long>("TagsId")
                        .HasColumnType("bigint");

                    b.HasKey("MediaFilesId", "TagsId");

                    b.HasIndex("TagsId");

                    b.ToTable("MediaFileModelTagModel");
                });

            modelBuilder.Entity("MediaTagger.Modules.Album.AlbumModel", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<DateTime>("CreatedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("Hidden")
                        .HasColumnType("bit");

                    b.Property<DateTime>("ModifiedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.ToTable("Album", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.FileSystem.PathModel", b =>
                {
                    b.Property<int>("PathId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("PathId"), 1L, 1);

                    b.Property<string>("Value")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("PathId");

                    b.ToTable("Paths", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.MediaFile.MediaFileModel", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<DateTime>("CreatedOn")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("DateTaken")
                        .HasColumnType("datetime2");

                    b.Property<string>("ExifJson")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("FileCreated")
                        .HasColumnType("datetime2");

                    b.Property<DateTime>("FileModified")
                        .HasColumnType("datetime2");

                    b.Property<long?>("FileSetPrimaryId")
                        .HasColumnType("bigint");

                    b.Property<long>("FileSize")
                        .HasColumnType("bigint");

                    b.Property<string>("Filename")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("Hidden")
                        .HasColumnType("bit");

                    b.Property<DateTime>("ModifiedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int?>("PathId")
                        .HasColumnType("int");

                    b.Property<long>("height")
                        .HasColumnType("bigint");

                    b.Property<long>("width")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("PathId");

                    b.ToTable("MediaFile", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.Property.PropertyModel", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<DateTime>("CreatedOn")
                        .HasColumnType("datetime2");

                    b.Property<bool>("Hidden")
                        .HasColumnType("bit");

                    b.Property<DateTime>("ModifiedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.ToTable("Propertiess", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.Property.PropertyValueModel", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<DateTime>("CreatedOn")
                        .HasColumnType("datetime2");

                    b.Property<bool>("Hidden")
                        .HasColumnType("bit");

                    b.Property<DateTime>("ModifiedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<long?>("PropertyId")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.ToTable("PropertyValues", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.Setting.SettingModel", b =>
                {
                    b.Property<string>("Scope")
                        .HasColumnType("nvarchar(450)")
                        .HasColumnOrder(1);

                    b.Property<string>("Name")
                        .HasColumnType("nvarchar(450)")
                        .HasColumnOrder(2);

                    b.Property<string>("Value")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Scope", "Name");

                    b.ToTable("Setting", (string)null);
                });

            modelBuilder.Entity("MediaTagger.Modules.Tag.TagModel", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("Id"), 1L, 1);

                    b.Property<DateTime>("CreatedOn")
                        .HasColumnType("datetime2");

                    b.Property<bool>("Hidden")
                        .HasColumnType("bit");

                    b.Property<DateTime>("ModifiedOn")
                        .HasColumnType("datetime2");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<long?>("ParentId")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("ParentId");

                    b.ToTable("Tags", (string)null);
                });

            modelBuilder.Entity("AlbumModelMediaFileModel", b =>
                {
                    b.HasOne("MediaTagger.Modules.Album.AlbumModel", null)
                        .WithMany()
                        .HasForeignKey("AlbumsId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("MediaTagger.Modules.MediaFile.MediaFileModel", null)
                        .WithMany()
                        .HasForeignKey("MediaFilesId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("MediaFileModelPropertyValueModel", b =>
                {
                    b.HasOne("MediaTagger.Modules.MediaFile.MediaFileModel", null)
                        .WithMany()
                        .HasForeignKey("MediaFilesId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("MediaTagger.Modules.Property.PropertyValueModel", null)
                        .WithMany()
                        .HasForeignKey("PropertiesId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("MediaFileModelTagModel", b =>
                {
                    b.HasOne("MediaTagger.Modules.MediaFile.MediaFileModel", null)
                        .WithMany()
                        .HasForeignKey("MediaFilesId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("MediaTagger.Modules.Tag.TagModel", null)
                        .WithMany()
                        .HasForeignKey("TagsId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("MediaTagger.Modules.MediaFile.MediaFileModel", b =>
                {
                    b.HasOne("MediaTagger.Modules.FileSystem.PathModel", "Directory")
                        .WithMany("Files")
                        .HasForeignKey("PathId");

                    b.Navigation("Directory");
                });

            modelBuilder.Entity("MediaTagger.Modules.Tag.TagModel", b =>
                {
                    b.HasOne("MediaTagger.Modules.Tag.TagModel", "Parent")
                        .WithMany("Children")
                        .HasForeignKey("ParentId");

                    b.Navigation("Parent");
                });

            modelBuilder.Entity("MediaTagger.Modules.FileSystem.PathModel", b =>
                {
                    b.Navigation("Files");
                });

            modelBuilder.Entity("MediaTagger.Modules.Tag.TagModel", b =>
                {
                    b.Navigation("Children");
                });
#pragma warning restore 612, 618
        }
    }
}
