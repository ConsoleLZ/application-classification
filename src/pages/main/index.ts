import { defineComponent, reactive, ref, toRefs, h } from "vue";
import ModalAddApplicationComp from "./comps/modal-add-application/index.vue";
import ModalAddTabComp from "./comps/modal-add-tab/index.vue";
import { Empty, message, Modal, Select } from "ant-design-vue";
import { onMounted, onUnmounted } from "vue";
import type { SelectValue } from 'ant-design-vue/es/select';
import draggable from 'vuedraggable'

export default defineComponent({
  components: {
    ModalAddApplicationComp,
    ModalAddTabComp,
    draggable
  },
  setup() {
    const state = reactive({
      listData: localStorage.getItem("tabs-data")
        ? JSON.parse(localStorage.getItem("tabs-data")!)
        : [],
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
    });

    const components = {
      modalAddApplicationRef: ref<InstanceType<
        typeof ModalAddApplicationComp
      > | null>(null),
      modalAddTabRef: ref<InstanceType<typeof ModalAddTabComp> | null>(null),
    };

    const methods = {
      onOpen(path: string) {
        window.ipcRenderer.executeExe(path);
      },
      // 打开增加分类标签的弹框
      onShowAddTab() {
        components.modalAddTabRef.value!.open();
      },
      onConfirmTab() {
        state.listData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
      },
      // 打开弹框(添加应用)
      onShow() {
        components.modalAddApplicationRef.value!.open();
      },
      // 编辑应用
      onEdit(index: number, item: any) {
        components.modalAddApplicationRef.value?.open(true, item, index);
      },
      // 修改确认保存方法
      onConfirm(data: any, isEdit: boolean, editIndex: number) {
        // 检查是否存在相同路径的应用
        const isDuplicate = state.listData.some((tab: any) => 
          tab.data.some((app: any) => 
            app.path === data.path && (!isEdit || app !== tab.data[editIndex])
          )
        );

        if (!isEdit && isDuplicate) {
          message.error('该应用已存在，不能重复添加');
          return;
        }

        if (isEdit) {
          // 编辑模式
          // 1. 找到包含当前应用的分类和应用索引
          let currentTabIndex = -1;
          let appIndex = -1;
          
          state.listData.forEach((tab: any, tIndex: number) => {
            const aIndex = tab.data.findIndex((app: any) => app.path === data.path);
            if (aIndex !== -1) {
              currentTabIndex = tIndex;
              appIndex = aIndex;
            }
          });

          if (currentTabIndex !== -1 && appIndex !== -1) {
            const currentTab = state.listData[currentTabIndex];
            
            if (currentTab.title === data.tab) {
              // 如果分类没有改变，直接更新数据
              currentTab.data[appIndex] = data;
            } else {
              // 如果分类改变了
              // 1. 从旧分类中删除
              currentTab.data.splice(appIndex, 1);
              
              // 2. 添加到新分类
              const newTab = state.listData.find((item: any) => item.title === data.tab);
              if (newTab) {
                newTab.data.push(data);
              }
            }
          }
        } else {
          // 添加模式
          state.listData.forEach((item: any) => {
            if (item.title === data.tab) {
              item.data.push(data);
            }
          });
        }
        
        // 保存到 localStorage
        localStorage.setItem("tabs-data", JSON.stringify(state.listData));
        message.success(isEdit ? '编辑成功' : '添加成功');
      },
      // 导出配置
      async exportData() {
        try {
          const data = localStorage.getItem("tabs-data");
          if (!data) {
            message.warning("暂无数据可导出");
            return;
          }
          const result = await window.ipcRenderer.exportConfig(data);
          // 只有当实际保存了文件才显示成功提示
          if (result === true) {
            message.success("导出成功");
          }
        } catch (error) {
          console.error("导出失败:", error);
          message.error("导出失败");
        }
      },
      // 导入配置
      async importData() {
        try {
          const result = await window.ipcRenderer.importConfig();
          if (result) {
            state.listData = JSON.parse(result);
            localStorage.setItem("tabs-data", result);
            message.success("导入成功");
          }
        } catch (error) {
          console.error("导入失败:", error);
          message.error("导入失败");
        }
      },
      // 清除配置
      clearData() {
        localStorage.removeItem("tabs-data");
        state.listData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
      },
      // 删除应用
      onDelete(tabTitle: string, index: number) {
        Modal.confirm({
          title: "确认删除",
          content: "确定要删除这个应用吗？",
          okText: "确定",
          cancelText: "取消",
          onOk() {
            // 找到对应的标签页
            const tab = state.listData.find(
              (item: any) => item.title === tabTitle
            );
            if (tab) {
              // 从数组中删除应用
              tab.data.splice(index, 1);
              // 更新本地存储
              localStorage.setItem("tabs-data", JSON.stringify(state.listData));
              message.success("删除成功");
            }
          },
        });
      },
      // 删除分类标签
      onDeleteTab(tabTitle: string) {
        Modal.confirm({
          title: "确认删除",
          content: "删除分类将同时删除该分类下的所有应用，确定要删除吗？",
          okText: "确定",
          cancelText: "取消",
          onOk() {
            // 找到并删除对应的标签
            const index = state.listData.findIndex((item: any) => item.title === tabTitle);
            if (index !== -1) {
              state.listData.splice(index, 1);
              // 更新本地存储
              localStorage.setItem("tabs-data", JSON.stringify(state.listData));
              message.success("删除成功");
            }
          },
        });
      },
      // 显示删除分类对话框
      showDeleteTab() {
        if (!state.listData.length) {
          message.warning("暂无分类可删除");
          return;
        }

        const options = state.listData.map((item: any) => ({
          label: item.title,
          value: item.title,
        }));

        let selectedTab = '';

        Modal.confirm({
          title: "删除分类",
          content: h(Select, {
            style: { width: '100%' },
            placeholder: "请选择要删除的分类",
            onChange: (value: SelectValue) => {
              selectedTab = value as string;
            },
            options: options
          }),
          okText: "确定",
          cancelText: "取消",
          onOk() {
            if (!selectedTab) {
              message.warning("请先选择要删除的分类");
              return Promise.reject();
            }
            return methods.onDeleteTab(selectedTab);
          },
        });
      },
      // 修改分类标签名称
      onRenameTab(oldTitle: string, newTitle: string) {
        // 检查新名称是否已存在
        if (state.listData.some((item: any) => item.title === newTitle)) {
          message.error('该分类名称已存在');
          return Promise.reject();
        }

        // 找到并修改对应的标签名称
        const tab = state.listData.find((item: any) => item.title === oldTitle);
        if (tab) {
          tab.title = newTitle;
          // 更新本地存储
          localStorage.setItem("tabs-data", JSON.stringify(state.listData));
          message.success("修改成功");
          return Promise.resolve();
        }
        return Promise.reject();
      },
      // 显示修改分类对话框
      showRenameTab() {
        if (!state.listData.length) {
          message.warning("暂无分类可修改");
          return;
        }

        const options = state.listData.map((item: any) => ({
          label: item.title,
          value: item.title,
        }));

        let selectedTab = '';
        let newTabName = '';

        Modal.confirm({
          title: "修改分类名称",
          content: h('div', {}, [
            h(Select, {
              style: { width: '100%', marginBottom: '16px' },
              placeholder: "请选择要修改的分类",
              onChange: (value: SelectValue) => {
                selectedTab = value as string;
              },
              options: options
            }),
            h('input', {
              type: 'text',
              placeholder: '请输入新的分类名称',
              class: 'ant-input',
              onInput: (e: Event) => {
                const target = e.target as HTMLInputElement;
                newTabName = target.value;
              }
            })
          ]),
          okText: "确定",
          cancelText: "取消",
          onOk() {
            if (!selectedTab) {
              message.warning("请先选择要修改的分类");
              return Promise.reject();
            }
            if (!newTabName.trim()) {
              message.warning("请输入新的分类名称");
              return Promise.reject();
            }
            return methods.onRenameTab(selectedTab, newTabName.trim());
          },
        });
      },
      onDragChange() {
        // 保存拖拽后的新顺序到 localStorage
        localStorage.setItem("tabs-data", JSON.stringify(state.listData));
      },
    };

    // 添加菜单事件监听
    onMounted(() => {
      window.ipcRenderer.on('show-add-tab', methods.onShowAddTab);
      window.ipcRenderer.on('menu-export', methods.exportData);
      window.ipcRenderer.on('menu-import', methods.importData);
      window.ipcRenderer.on('menu-clear', () => {
        Modal.confirm({
          title: '确认清除',
          content: '确定要清除所有配置吗？此操作不可恢复！',
          okText: '确定',
          cancelText: '取消',
          onOk: methods.clearData
        });
      });
      window.ipcRenderer.on('show-delete-tab', methods.showDeleteTab);
      window.ipcRenderer.on('show-rename-tab', methods.showRenameTab);
    });

    // 清理事件监听
    onUnmounted(() => {
      window.ipcRenderer.off('show-add-tab', methods.onShowAddTab);
      window.ipcRenderer.off('menu-export', methods.exportData);
      window.ipcRenderer.off('menu-import', methods.importData);
      window.ipcRenderer.off('menu-clear', methods.clearData);
      window.ipcRenderer.off('show-delete-tab', methods.showDeleteTab);
      window.ipcRenderer.off('show-rename-tab', methods.showRenameTab);
    });

    return {
      ...toRefs(state),
      ...methods,
      ...components,
    };
  },
});
