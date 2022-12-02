using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.MediaItem;
using MediaTagger.Modules.Settings;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Data
{
    public class MediaTaggerContext : DbContext
  {
    private static string MEDIA_ITEM_TABLE = "MediaItem";
    private static string MEDIA_FILE_TABLE = "MediaFile";
    private static string SETTING_TABLE = "Setting";
    private static string TAG_TABLE = "Tag";
    private static string FILE_PATH_TABLE = "FilePath";
    private static string MEDIA_GROUP_TABLE = "MediaGroup";

    public MediaTaggerContext(DbContextOptions<MediaTaggerContext> options) : base(options)
    {

    }

    public MediaTaggerContext() : base()
    {

    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
       //optionsBuilder.EnableSensitiveDataLogging();
      base.OnConfiguring(optionsBuilder);
    }

    public DbSet<SettingModel> Settings => Set<SettingModel>();
    public DbSet<TagModel> Tags=> Set<TagModel>();
    public DbSet<MediaItemModel> MediaItems => Set<MediaItemModel>();
    public DbSet<MediaFileModel> MediaFiles => Set<MediaFileModel>();
    public DbSet<PathModel> Paths => Set<PathModel>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      
       modelBuilder.Entity<SettingModel>()
        .HasKey(s => new { s.Scope, s.Name });
      modelBuilder.Entity<SettingModel>().ToTable("Setting");

      modelBuilder.Entity<TagModel>().HasIndex(t => t.Name).IsUnique();
      modelBuilder.Entity<TagModel>().ToTable("Tag");


      modelBuilder.Entity<MediaFileModel>().HasKey(file => file.MediaFileId);
      modelBuilder.Entity<MediaItemModel>().HasKey(file => file.MediaItemId);


      modelBuilder.Entity<MediaFileModel>()
        .HasOne<MediaItemModel>(item => item.MediaItem)
        .WithMany(item => item.Files)
        .HasForeignKey(file => file.MediaItemId)
        .OnDelete(DeleteBehavior.NoAction);
      
      modelBuilder.Entity<MediaItemModel>().HasOne(item => item.ThumbnailFile);
      modelBuilder.Entity<MediaItemModel>().HasOne(item => item.PrimaryFile);
 
      modelBuilder.Entity<MediaItemModel>().ToTable("MediaItem");

      modelBuilder.Entity<PathModel>().ToTable("FileSystemPath");

      modelBuilder.Entity<MediaFileModel>()
      .HasOne<PathModel>(item => item.Path)
      .WithMany(item => item.Files)
      .HasForeignKey(file => file.PathId)
      .OnDelete(DeleteBehavior.NoAction);
      modelBuilder.Entity<MediaFileModel>().HasIndex(file => file.Name);
      modelBuilder.Entity<MediaFileModel>().HasIndex(file => file.PathId);
      modelBuilder.Entity<MediaFileModel>().ToTable("MediaFile");


    }


  }
}
