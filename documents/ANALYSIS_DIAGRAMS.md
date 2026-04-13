# Sơ đồ phân tích nghiệp vụ hệ thống ERP

Tài liệu này mô tả hệ thống ở mức phân tích nghiệp vụ, tập trung vào chức năng và luồng dữ liệu, không đi vào chi tiết kỹ thuật triển khai.

## 1) Sơ đồ chức năng (BFD)

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 60, "rankSpacing": 75, "curve": "basis"}} }%%
flowchart TB
    L0[Hệ thống quản trị doanh nghiệp]

    L0 --> F1[Quản lý truy cập và phân quyền]
    L0 --> F2[Quản lý nhân sự]
    L0 --> F3[Quản lý hàng hóa và kho]
    L0 --> F4[Xử lý mua vào và nhập kho]
    L0 --> F5[Xử lý bán hàng và chăm sóc khách hàng]
    L0 --> F6[Xử lý đổi trả]
    L0 --> F7[Điều hành và báo cáo]
    L0 --> F8[Quản trị vận hành hệ thống]

    F1 --> F11[Tiếp nhận đăng nhập]
    F1 --> F12[Quản lý tài khoản sử dụng]
    F1 --> F13[Thiết lập quyền theo vai trò]

    F2 --> F21[Quản lý hồ sơ nhân sự]
    F2 --> F22[Quản lý cơ cấu tổ chức]
    F2 --> F23[Theo dõi biến động công việc]
    F2 --> F24[Xử lý nghỉ phép và nghỉ việc]
    F2 --> F25[Tính lương và phúc lợi]

    F3 --> F31[Quản lý danh mục hàng hóa]
    F3 --> F32[Theo dõi tồn kho]
    F3 --> F33[Theo dõi lịch sử xuất nhập tồn]
    F3 --> F34[Quản lý kho và vị trí lưu trữ]

    F4 --> F41[Quản lý nhà cung cấp]
    F4 --> F42[Lập và duyệt chứng từ nhập]
    F4 --> F43[Cập nhật số lượng sau nhập]

    F5 --> F51[Quản lý thông tin khách hàng]
    F5 --> F52[Lập và theo dõi đơn bán]
    F5 --> F53[Xác nhận giao hàng và thanh toán]

    F6 --> F61[Tiếp nhận yêu cầu đổi trả]
    F6 --> F62[Thẩm định điều kiện đổi trả]
    F6 --> F63[Hoàn tiền hoặc bù trừ và hoàn kho]

    F7 --> F71[Tổng hợp số liệu điều hành]
    F7 --> F72[Phân tích hiệu quả kinh doanh]
    F7 --> F73[Phân tích nhân sự và năng suất]

    F8 --> F81[Thiết lập chính sách vận hành]
    F8 --> F82[Quản lý tài liệu nghiệp vụ]
    F8 --> F83[Giám sát trạng thái hệ thống]
```

## 2) Sơ đồ ngữ cảnh (Context Diagram)

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 70, "rankSpacing": 90, "curve": "monotoneX"}} }%%
flowchart TB
    subgraph NOIBO[Tác nhân nội bộ]
        A1[Nhân viên]
        A2[Quản lý nhân sự]
        A3[Kinh doanh]
        A4[Kho vận]
        A5[Quản trị hệ thống]
    end

    H0((Hệ thống ERP))

    subgraph BENNGOAI[Tác nhân bên ngoài]
        A6[Khách hàng]
        A7[Nhà cung cấp]
    end

    A1 -->|Thông tin cá nhân, đề nghị nghiệp vụ| H0
    H0 -->|Kết quả xử lý và thông báo trạng thái| A1

    A2 -->|Yêu cầu quản lý nhân sự, chấm công, lương| H0
    H0 -->|Báo cáo nhân sự, quyết định phê duyệt| A2

    A3 -->|Yêu cầu bán hàng, chăm sóc khách hàng| H0
    H0 -->|Thông tin đơn bán, doanh thu, công nợ| A3

    A4 -->|Yêu cầu nhập kho, xuất kho, kiểm kê| H0
    H0 -->|Số liệu tồn kho và cảnh báo thiếu hàng| A4

    A5 -->|Yêu cầu cấu hình chính sách và quyền truy cập| H0
    H0 -->|Thông tin vận hành và cảnh báo rủi ro| A5

    A6 -->|Thông tin mua hàng, yêu cầu đổi trả| H0
    H0 -->|Xác nhận đơn, tiến độ giao hàng, kết quả đổi trả| A6

    A7 -->|Thông tin cung ứng và chứng từ giao hàng| H0
    H0 -->|Kế hoạch nhập hàng, xác nhận nhận hàng| A7
```

## 3) Sơ đồ luồng dữ liệu (DFD) mức đỉnh (Level 0)

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 85, "rankSpacing": 100, "curve": "linear"}} }%%
flowchart TB
    subgraph TACNHAN[Tác nhân]
        E1[Người dùng nội bộ]
        E2[Khách hàng]
        E3[Nhà cung cấp]
    end

    subgraph TIENTRINH[Các tiến trình chính]
        P1((1.0 Quản lý truy cập))
        P2((2.0 Quản lý nhân sự))
        P3((3.0 Quản lý hàng hóa và kho))
        P4((4.0 Quản lý bán hàng và đổi trả))
        P5((5.0 Tổng hợp báo cáo điều hành))
        P6((6.0 Quản trị chính sách hệ thống))
    end

    subgraph KHO[Kho dữ liệu nghiệp vụ]
        D1[(D1 Hồ sơ tài khoản và phân quyền)]
        D2[(D2 Hồ sơ nhân sự và cơ cấu tổ chức)]
        D3[(D3 Dữ liệu công việc, nghỉ phép, tiền lương)]
        D4[(D4 Danh mục hàng hóa và số liệu tồn kho)]
        D5[(D5 Giao dịch mua vào và nhập kho)]
        D6[(D6 Giao dịch bán hàng và đổi trả)]
        D7[(D7 Chính sách vận hành và tài liệu)]
    end

    E1 -->|Yêu cầu đăng nhập và tác nghiệp| P1
    E1 -->|Yêu cầu quản lý nhân sự| P2
    E1 -->|Yêu cầu quản lý hàng hóa kho| P3
    E1 -->|Yêu cầu xử lý bán hàng đổi trả| P4
    E1 -->|Yêu cầu phân tích và theo dõi| P5
    E1 -->|Yêu cầu cấu hình vận hành| P6

    E2 -->|Đơn mua hàng và yêu cầu sau bán| P4
    E3 -->|Thông tin cung ứng hàng hóa| P3

    P1 <--> D1

    P2 <--> D2
    P2 <--> D3
    P2 -->|Đối chiếu quyền xử lý| D1

    P3 <--> D4
    P3 <--> D5

    P4 <--> D6
    P4 -->|Đối chiếu và cập nhật tồn kho| D4

    P5 -->|Khai thác dữ liệu tổng hợp| D2
    P5 -->|Khai thác dữ liệu tổng hợp| D3
    P5 -->|Khai thác dữ liệu tổng hợp| D4
    P5 -->|Khai thác dữ liệu tổng hợp| D5
    P5 -->|Khai thác dữ liệu tổng hợp| D6

    P6 <--> D7
    P6 -->|Cập nhật nguyên tắc phân quyền| D1

    P1 -->|Kết quả xác thực và quyền truy cập| E1
    P2 -->|Kết quả xử lý nhân sự| E1
    P3 -->|Kết quả xử lý kho và mua vào| E1
    P3 -->|Xác nhận kế hoạch nhận hàng| E3
    P4 -->|Kết quả bán hàng và đổi trả| E1
    P4 -->|Trạng thái đơn hàng và đổi trả| E2
    P5 -->|Báo cáo điều hành| E1
    P6 -->|Kết quả cấu hình vận hành| E1
```

## 4) Sơ đồ luồng dữ liệu (DFD) mức dưới đỉnh (Level 1)

Phần này phân rã đầy đủ các tiến trình chính ở mức đỉnh (1.0 đến 6.0) để thể hiện rõ các bước xử lý nghiệp vụ và luồng dữ liệu nội bộ.

### 4.1) Phân rã tiến trình 1.0 - Quản lý truy cập

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 80, "rankSpacing": 95, "curve": "basis"}} }%%
flowchart TB
    U1[Người dùng nội bộ]
    A1((1.1 Tiếp nhận yêu cầu truy cập))
    A2((1.2 Kiểm tra tính hợp lệ thông tin))
    A3((1.3 Xác định phạm vi quyền sử dụng))
    A4((1.4 Ghi nhận lịch sử truy cập))
    A5((1.5 Trả kết quả truy cập))

    K11[(K1 Hồ sơ tài khoản)]
    K12[(K2 Danh mục quyền theo vai trò)]
    K13[(K3 Nhật ký truy cập)]

    U1 -->|Thông tin truy cập| A1
    A1 --> A2
    A2 -->|Đối chiếu tài khoản| K11
    K11 -->|Kết quả đối chiếu| A2
    A2 --> A3
    A3 -->|Đối chiếu quyền| K12
    K12 -->|Quyền được phép| A3
    A3 --> A4
    A4 -->|Lưu lịch sử| K13
    A4 --> A5
    A5 -->|Kết quả truy cập và phạm vi sử dụng| U1
```

### 4.2) Phân rã tiến trình 2.0 - Quản lý nhân sự

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 85, "rankSpacing": 100, "curve": "linear"}} }%%
flowchart TB
    H1[Nhân viên]
    H2[Quản lý nhân sự]

    B1((2.1 Cập nhật hồ sơ nhân sự))
    B2((2.2 Quản lý cơ cấu đơn vị và vị trí))
    B3((2.3 Ghi nhận quá trình công tác))
    B4((2.4 Tiếp nhận và phê duyệt nghỉ phép nghỉ việc))
    B5((2.5 Tính lương và tổng hợp phúc lợi))
    B6((2.6 Trả kết quả nhân sự))

    K21[(K1 Hồ sơ nhân sự)]
    K22[(K2 Cơ cấu tổ chức và vị trí)]
    K23[(K3 Lịch sử công tác)]
    K24[(K4 Hồ sơ nghỉ phép nghỉ việc)]
    K25[(K5 Dữ liệu lương và phúc lợi)]

    H1 -->|Thông tin cá nhân và đề nghị| B1
    H2 -->|Yêu cầu quản trị nhân sự| B2
    H2 -->|Yêu cầu duyệt nghỉ phép nghỉ việc| B4
    H2 -->|Yêu cầu chốt kỳ lương| B5

    B1 <--> K21
    B2 <--> K22
    B3 <--> K23
    B4 <--> K24
    B5 <--> K25

    B1 --> B3
    B2 --> B3
    B4 --> B5
    B3 --> B6
    B5 --> B6

    B6 -->|Kết quả cập nhật và quyết định xử lý| H1
    B6 -->|Báo cáo nhân sự và kết quả tính lương| H2
```

### 4.3) Phân rã tiến trình 3.0 - Quản lý hàng hóa và kho

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 85, "rankSpacing": 100, "curve": "cardinal"}} }%%
flowchart TB
    W1[Kho vận]
    W2[Nhà cung cấp]

    C1((3.1 Quản lý danh mục hàng hóa))
    C2((3.2 Ghi nhận nhập hàng))
    C3((3.3 Ghi nhận xuất hàng))
    C4((3.4 Kiểm kê và điều chỉnh tồn kho))
    C5((3.5 Theo dõi lịch sử biến động kho))
    C6((3.6 Cảnh báo thiếu hàng và đề xuất bổ sung))

    K31[(K1 Danh mục hàng hóa)]
    K32[(K2 Tồn kho hiện thời)]
    K33[(K3 Chứng từ nhập hàng)]
    K34[(K4 Chứng từ xuất hàng)]
    K35[(K5 Nhật ký biến động kho)]

    W2 -->|Thông tin giao hàng| C2
    W1 -->|Yêu cầu cập nhật kho| C1
    W1 -->|Yêu cầu xuất hàng| C3
    W1 -->|Kết quả kiểm kê| C4

    C1 <--> K31
    C2 <--> K33
    C3 <--> K34
    C4 <--> K32

    C2 -->|Cập nhật tăng tồn| K32
    C3 -->|Cập nhật giảm tồn| K32
    C2 -->|Phát sinh lịch sử nhập| C5
    C3 -->|Phát sinh lịch sử xuất| C5
    C4 -->|Phát sinh lịch sử điều chỉnh| C5
    C5 <--> K35

    C5 --> C6
    C6 -->|Cảnh báo thiếu hàng và đề xuất mua| W1
```

### 4.4) Phân rã tiến trình 4.0 - Quản lý bán hàng và đổi trả

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 90, "rankSpacing": 100, "curve": "monotoneX"}} }%%
flowchart TB
    X1[Nhân viên kinh doanh]
    X2[Khách hàng]
    X3[Kho vận]

    D1((4.1 Tiếp nhận nhu cầu mua hàng))
    D2((4.2 Kiểm tra khả năng đáp ứng))
    D3((4.3 Lập và xác nhận đơn bán))
    D4((4.4 Theo dõi giao hàng và thanh toán))
    D5((4.5 Tiếp nhận yêu cầu đổi trả))
    D6((4.6 Thẩm định và xử lý đổi trả))
    D7((4.7 Hoàn kho và cập nhật kết quả tài chính))

    K41[(K1 Hồ sơ khách hàng)]
    K42[(K2 Đơn bán và trạng thái thực hiện)]
    K43[(K3 Tồn kho hiện thời)]
    K44[(K4 Lịch sử xuất nhập hàng)]
    K45[(K5 Hồ sơ đổi trả)]

    X2 -->|Thông tin nhu cầu mua| D1
    X1 -->|Yêu cầu tạo đơn| D1
    D1 <--> K41
    D1 --> D2

    D2 <--> K43
    D2 --> D3

    D3 <--> K42
    D3 -->|Yêu cầu xuất hàng| X3
    X3 -->|Kết quả xuất hàng| D4

    D4 -->|Cập nhật tiến độ giao và thanh toán| K42
    D4 -->|Ghi nhận biến động kho do bán hàng| K44
    D4 -->|Thông báo giao hàng thanh toán| X2

    X2 -->|Yêu cầu đổi trả sau bán| D5
    X1 -->|Thông tin tiếp nhận đổi trả| D5
    D5 -->|Ghi nhận hồ sơ đổi trả| K45
    D5 --> D6

    D6 -->|Đối chiếu điều kiện đơn hàng| K42
    D6 -->|Đối chiếu hồ sơ đổi trả| K45
    D6 --> D7

    D7 -->|Cập nhật nhập lại hàng| K43
    D7 -->|Ghi nhận biến động kho do đổi trả| K44
    D7 -->|Cập nhật kết quả đổi trả| K45
    D7 -->|Điều chỉnh kết quả tài chính đơn hàng| K42

    D3 -->|Xác nhận đơn bán| X1
    D7 -->|Kết quả xử lý đổi trả| X1
    D7 -->|Thông báo kết quả đổi trả| X2
```

### 4.5) Phân rã tiến trình 5.0 - Tổng hợp báo cáo điều hành

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 85, "rankSpacing": 100, "curve": "linear"}} }%%
flowchart TB
    R1[Ban điều hành]
    R2[Quản lý bộ phận]

    E1((5.1 Thu thập dữ liệu hoạt động))
    E2((5.2 Làm sạch và chuẩn hóa dữ liệu))
    E3((5.3 Tính toán chỉ số điều hành))
    E4((5.4 Phân tích xu hướng và cảnh báo))
    E5((5.5 Công bố báo cáo theo vai trò))

    K51[(K1 Dữ liệu nhân sự)]
    K52[(K2 Dữ liệu kho)]
    K53[(K3 Dữ liệu mua vào)]
    K54[(K4 Dữ liệu bán hàng đổi trả)]
    K55[(K5 Kho báo cáo điều hành)]

    E1 -->|Khai thác dữ liệu| K51
    E1 -->|Khai thác dữ liệu| K52
    E1 -->|Khai thác dữ liệu| K53
    E1 -->|Khai thác dữ liệu| K54
    E1 --> E2
    E2 --> E3
    E3 --> E4
    E4 --> E5

    E5 -->|Lưu bộ báo cáo kỳ| K55
    E5 -->|Báo cáo tổng hợp| R1
    E5 -->|Báo cáo theo phạm vi phụ trách| R2
```

### 4.6) Phân rã tiến trình 6.0 - Quản trị chính sách hệ thống

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 85, "rankSpacing": 100, "curve": "basis"}} }%%
flowchart TB
    S1[Quản trị hệ thống]
    S2[Người dùng nội bộ]

    F1((6.1 Thiết lập chính sách vận hành))
    F2((6.2 Quản lý quyền và phạm vi sử dụng))
    F3((6.3 Quản lý biểu mẫu và tài liệu nghiệp vụ))
    F4((6.4 Theo dõi trạng thái vận hành))
    F5((6.5 Ghi nhận sự cố và cảnh báo))
    F6((6.6 Thông báo cập nhật chính sách))

    K61[(K1 Kho chính sách vận hành)]
    K62[(K2 Kho quyền sử dụng)]
    K63[(K3 Kho tài liệu nghiệp vụ)]
    K64[(K4 Nhật ký vận hành)]
    K65[(K5 Nhật ký cảnh báo và xử lý)]

    S1 -->|Yêu cầu cập nhật chính sách| F1
    S1 -->|Yêu cầu cập nhật quyền| F2
    S1 -->|Yêu cầu quản lý tài liệu| F3

    F1 <--> K61
    F2 <--> K62
    F3 <--> K63

    F4 -->|Thu thập trạng thái vận hành| K64
    F4 --> F5
    F5 -->|Ghi nhận cảnh báo và hướng xử lý| K65
    F1 --> F6
    F2 --> F6
    F3 --> F6
    F5 --> F6

    F6 -->|Thông báo thay đổi và hướng dẫn áp dụng| S2
```

## Ghi chú

- Các sơ đồ được diễn đạt theo góc nhìn nghiệp vụ, dùng thuật ngữ dễ hiểu với người không chuyên kỹ thuật.
- DFD mức đỉnh thể hiện bức tranh tổng thể giữa tác nhân, tiến trình và kho dữ liệu.
- DFD mức dưới đỉnh phân rã chi tiết một tiến trình trọng yếu để làm rõ luồng dữ liệu nội bộ.
