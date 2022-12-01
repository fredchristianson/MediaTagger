using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.MediaItem;
using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Modules.FileSystem
{
    public class PathModel
    {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int PathId { get; set; }

    public string Value { get; set; } = string.Empty;

    public virtual List<MediaFileModel> Files { get; set; } = new List<MediaFileModel>();


  }
}
