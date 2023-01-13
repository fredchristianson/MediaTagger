using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public abstract class MediaEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedOn { get; set; } = DateTime.Now;
    [Required]
    public DateTime ModifiedOn { get; set; } = DateTime.Now;

    // Hidden items are not normally shown (could be called Deleted or Trash)
    [Required]
    public Boolean Hidden { get; set; } = false;
}