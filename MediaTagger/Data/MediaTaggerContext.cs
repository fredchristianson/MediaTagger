

using MediaTagger.Models;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Data
{
  public class MediaTaggerContext : DbContext
  {
    public MediaTaggerContext(DbContextOptions<MediaTaggerContext> options) : base(options)
    {

    }

    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<Tag> Tags=> Set<Tag>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      modelBuilder.Entity<Setting>()
        .HasKey(s => new { s.Scope, s.Name });
      modelBuilder.Entity<Setting>().ToTable("Setting");

      modelBuilder.Entity<Tag>().HasIndex(t => t.Name).IsUnique();
      modelBuilder.Entity<Tag>().ToTable("Tag");
    }
  }
}
