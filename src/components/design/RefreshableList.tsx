import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  ListRenderItem,
  FlatListProps,
} from 'react-native';

interface RefreshableListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  contentContainerStyle?: ViewStyle;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

function RefreshableList<T>({
  data,
  renderItem,
  onRefresh,
  isRefreshing,
  contentContainerStyle,
  ListHeaderComponent,
  ...flatListProps
}: RefreshableListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor='#0f0'
          colors={['#0f0']}
          progressBackgroundColor='#000'
        />
      }
      contentContainerStyle={[styles.listContainer, contentContainerStyle]}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
  },
});

export default RefreshableList;
