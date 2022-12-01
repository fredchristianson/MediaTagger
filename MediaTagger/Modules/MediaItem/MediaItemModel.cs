using MediaTagger.Modules.MediaFile;
using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Modules.MediaItem
{
    public class MediaItemModel
    {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int MediaItemId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime Modified { get; set; } = DateTime.UtcNow;
    public DateTime Created { get; set; } = DateTime.UtcNow;

    [ForeignKey("PrimaryFileId")]
    public virtual MediaFileModel? PrimaryFile { get; set; }
    public int PrimaryFileId { get; set; }

    [ForeignKey("ThumbnailFileId")]
    public virtual MediaFileModel? ThumbnailFile { get; set; }
    public int? ThumbnailFileId { get; set; }

    public virtual List<MediaFileModel> Files { get; set; } = new List<MediaFileModel>();
  }
}
