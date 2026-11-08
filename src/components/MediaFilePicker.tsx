import { useRef } from 'react'
import { UiButton } from './atoms/MuiPrimitives'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'

type Props = {
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

/** Media upload molecule: a wrapped MUI button opens the native file dialog.
 * The underlying input remains visually hidden but available to the browser. */
export function MediaFilePicker({ file, onFileChange, disabled = false }: Props) {
  const input = useRef<HTMLInputElement>(null)
  return <div className="studio-media-file-picker">
    <input
      ref={input}
      className="studio-visually-hidden-file"
      type="file"
      tabIndex={-1}
      aria-label="Select an image or video file"
      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
      disabled={disabled}
      onChange={event => {
        onFileChange(event.target.files?.[0] ?? null)
        event.target.value = ''
      }}
    />
    <UiButton
      type="button"
      variant="outlined"
      color="primary"
      size="medium"
      disabled={disabled}
      startIcon={<UploadFileOutlinedIcon />}
      onClick={() => input.current?.click()}
    >
      {file ? 'Change file' : 'Choose file'}
    </UiButton>
    <span className="studio-media-file-name" role="status">
      {file ? file.name : 'No file selected'}
    </span>
  </div>
}
