import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface UploadImageProps {
  value?: string;
  onChange?: (url: string) => void;
}

// Pure presentational upload widget: never calls an API itself, only forwards files via props.
export function UploadImage({ value, onChange }: UploadImageProps) {
  const props: UploadProps = {
    listType: 'picture-card',
    maxCount: 1,
    showUploadList: true,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) message.error('Chỉ chấp nhận file ảnh');
      return isImage ? false : Upload.LIST_IGNORE;
    },
    onChange: (info) => {
      const file = info.file.originFileObj ?? info.file;
      if (file instanceof Blob) {
        const url = URL.createObjectURL(file);
        onChange?.(url);
      }
    },
  };

  return (
    <Upload {...props}>
      {value ? <img src={value} alt="" style={{ width: '100%' }} /> : <PlusOutlined />}
    </Upload>
  );
}
