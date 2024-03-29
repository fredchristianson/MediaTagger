﻿using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Modules.Album;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.Property;
using MediaTagger.Modules.Tag;

namespace MediaTagger.Modules.MediaFile
{
    public class MediaFileModel : MediaEntity
    {


        public DateTime FileModified { get; set; } = DateTime.Now;
        public DateTime FileCreated { get; set; } = DateTime.Now;
        public DateTime? DateTaken { get; set; } = DateTime.Now;

        // if multiple files are in a set, the fileSetPrimaryId is the main one to display
        public long? FileSetPrimaryId { get; set; }

        [ForeignKey("PathId")]
        public virtual PathModel Directory { get; set; } = null!;

        public int? PathId { get; set; }
        public string Filename { get; set; } = string.Empty;

        public long FileSize { get; set; }
        public long Width { get; set; }
        public long Height { get; set; }

        public long RotationDegrees { get; set; } = 0;

        public string? ExifJson { get; set; }


        public virtual ICollection<TagModel> Tags { get; set; } = null!;
        public virtual ICollection<PropertyValueModel> Properties { get; set; } = null!;
        public virtual ICollection<AlbumModel> Albums { get; set; } = null!;

    }


}
