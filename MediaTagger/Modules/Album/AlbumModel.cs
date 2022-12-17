using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.Album
{
    public class AlbumModel : MediaEntity
    {
        public string Description { get; set; } = string.Empty;

        public virtual ICollection<MediaFileModel> MediaFiles { get; set; } = null!;
    }
}
