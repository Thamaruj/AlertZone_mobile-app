import Toast, {
  BaseToast,
  ErrorToast,
  BaseToastProps,
} from "react-native-toast-message";

export const toastConfig = {
success: (props: BaseToastProps) => (
  <BaseToast
    {...props}
    style={{
      borderLeftColor: "#1ABC9C",   // accent line
      backgroundColor: "#143D3D",   // dark background
      borderRadius: 12,
      paddingVertical: 10,           // increased vertical padding
      paddingHorizontal: 0,
      minHeight:70,
      maxHeight:100,
      marginHorizontal: 0,
      width: 'auto',
      maxWidth: '90%',
      alignSelf: 'center',
    }}
    text1Style={{
      fontSize: 16,
      fontWeight: "light",
      color: "#FFFFFF",             // optional spacing below title
    }}
    text2Style={{
      fontSize: 13,
      color: "#A0E1DD",
      flex: 1,
    }}
    text2Props={{
      numberOfLines: 0,             // allows multi-line text
    }}
  />
),

  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#FF4D4F",   // accent line
        backgroundColor: "#4A1A1A",   // dark error background
        borderRadius: 12,
        paddingVertical: 10,           // increased vertical padding
        paddingHorizontal: 0,
        minHeight:70,
        maxHeight:100,
        marginHorizontal: 0,
        width: 'auto',
        maxWidth: '90%',
        alignSelf: 'center',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",              // title text
      }}
      text2Style={{
        fontSize: 13,
        color: "#FF9999",              
        flex: 1,
      }}
      text2Props={{
        numberOfLines: 0,   // allow wrapping
      }}
    />
  ),
};