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

    public MediaFileModel? PrimaryFile { get; set; }
    public MediaFileModel? ThumbnailFile { get; set; }
    public List<MediaFileModel>? Files { get; set; }
  }
}
