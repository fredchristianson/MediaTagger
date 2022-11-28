using MediaTagger.Modules.Settings;
using MediaTagger.Modules.Tag;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Data
{
    public class MediaTaggerContext : DbContext
  {
    public MediaTaggerContext(DbContextOptions<MediaTaggerContext> options) : base(options)
    {

    }

    public DbSet<SettingModel> Settings => Set<SettingModel>();
    public DbSet<TagModel> Tags=> Set<TagModel>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      modelBuilder.Entity<SettingModel>()
        .HasKey(s => new { s.Scope, s.Name });
      modelBuilder.Entity<SettingModel>().ToTable("Setting");

      modelBuilder.Entity<TagModel>().HasIndex(t => t.Name).IsUnique();
      modelBuilder.Entity<TagModel>().ToTable("Tag");
    }
  }
}
