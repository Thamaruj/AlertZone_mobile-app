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
      borderLeftColor: "#0D8A72",
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 0,
      minHeight:70,
      maxHeight:100,
      marginHorizontal: 0,
      width: 'auto',
      maxWidth: '90%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    }}
    text1Style={{
      fontSize: 16,
      fontWeight: "600",
      color: "#1A1A1A",
    }}
    text2Style={{
      fontSize: 13,
      color: "#6B7280",
      flex: 1,
    }}
    text2Props={{
      numberOfLines: 0,
    }}
  />
),

  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#DC2626",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 0,
        minHeight:70,
        maxHeight:100,
        marginHorizontal: 0,
        width: 'auto',
        maxWidth: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#1A1A1A",
      }}
      text2Style={{
        fontSize: 13,
        color: "#6B7280",              
        flex: 1,
      }}
      text2Props={{
        numberOfLines: 0,
      }}
    />
  ),
};