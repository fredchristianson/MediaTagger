using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Setting;
using MediaTagger.Modules.Tag;
using MediaTagger.Modules.Property;
using Microsoft.EntityFrameworkCore;
using MediaTagger.Modules.Album;

namespace MediaTagger.Data
{
    public class MediaTaggerContext : DbContext
    {

        public MediaTaggerContext(DbContextOptions<MediaTaggerContext> options) : base(options)
        {
            //MigrateDatabaseToLatestVersion();
            //Database.SetInitializer(new MigrateDatabaseToLatestVersion<MediaTaggerContext, EF6Console.Migrations.Configuration>());
        }

        public MediaTaggerContext() : base()
        {
            // Database.SetInitializer(new MigrateDatabaseToLatestVersion<MediaTaggerContext, EF6Console.Migrations.Configuration>());
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            //optionsBuilder.EnableSensitiveDataLogging();

            base.OnConfiguring(optionsBuilder);
        }

        public DbSet<SettingModel> Settings => Set<SettingModel>();
        public DbSet<TagModel> Tags => Set<TagModel>();
        public DbSet<AlbumModel> Albums => Set<AlbumModel>();
        public DbSet<MediaFileModel> MediaFiles => Set<MediaFileModel>();
        public DbSet<PathModel> Paths => Set<PathModel>();
        public DbSet<PropertyModel> Properties => Set<PropertyModel>();
        public DbSet<PropertyValueModel> PropertyValues => Set<PropertyValueModel>();

        // public DbSet<AlbumFileModel> AlbumFiles => Set<AlbumFileModel>();
        // public DbSet<FileTagModel> FileTags => Set<FileTagModel>();
        // public DbSet<FilePropertyValueModel> FileProperties => Set<FilePropertyValueModel>();


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {


            // modelBuilder.Entity<AlbumFileModel>().HasKey(af => new { af.AlbumId, af.MediaFileId });
            // modelBuilder.Entity<AlbumFileModel>()
            //     .HasOne<AlbumModel>(sc => sc.Album)
            //     .WithMany(s => s.AlbumFiles)
            //     .HasForeignKey(sc => sc.AlbumId);
            // modelBuilder.Entity<AlbumFileModel>()
            //     .HasOne<MediaFileModel>(sc => sc.MediaFile)
            //     .WithMany(s => s.AlbumFiles)
            //     .HasForeignKey(sc => sc.MediaFileId);
            // modelBuilder.Entity<AlbumFileModel>().ToTable("AlbumFileMap");


            modelBuilder.Entity<SettingModel>()
              .HasKey(s => new { s.Scope, s.Name });


            modelBuilder.Entity<MediaFileModel>().ToTable("MediaFile");
            modelBuilder.Entity<AlbumModel>().ToTable("Album");
            modelBuilder.Entity<SettingModel>().ToTable("Setting");
            modelBuilder.Entity<TagModel>().ToTable("Tags");
            modelBuilder.Entity<PathModel>().ToTable("Paths");
            modelBuilder.Entity<PropertyModel>().ToTable("Properties");
            modelBuilder.Entity<PropertyValueModel>().ToTable("PropertyValues");
            modelBuilder.Entity<PropertyModel>().ToTable("Propertiess");


        }


    }
}
