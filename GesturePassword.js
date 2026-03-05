import React, { useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, PanResponder, Alert } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 60;
const MARGIN = (width - CIRCLE_SIZE * 3) / 4;

export default function GesturePassword({ onSuccess, onSetup, isSetup = false, storedPattern = null }) {
  const theme = useTheme();
  const [pattern, setPattern] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [lines, setLines] = useState([]);
  const [confirmPattern, setConfirmPattern] = useState(null);
  const [step, setStep] = useState(isSetup ? 'setup' : 'verify');

  const circles = [
    { id: 0, x: MARGIN, y: 100 },
    { id: 1, x: MARGIN * 2 + CIRCLE_SIZE, y: 100 },
    { id: 2, x: MARGIN * 3 + CIRCLE_SIZE * 2, y: 100 },
    { id: 3, x: MARGIN, y: 100 + MARGIN + CIRCLE_SIZE },
    { id: 4, x: MARGIN * 2 + CIRCLE_SIZE, y: 100 + MARGIN + CIRCLE_SIZE },
    { id: 5, x: MARGIN * 3 + CIRCLE_SIZE * 2, y: 100 + MARGIN + CIRCLE_SIZE },
    { id: 6, x: MARGIN, y: 100 + (MARGIN + CIRCLE_SIZE) * 2 },
    { id: 7, x: MARGIN * 2 + CIRCLE_SIZE, y: 100 + (MARGIN + CIRCLE_SIZE) * 2 },
    { id: 8, x: MARGIN * 3 + CIRCLE_SIZE * 2, y: 100 + (MARGIN + CIRCLE_SIZE) * 2 },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        checkCircleHit(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPos({ x: locationX, y: locationY });
        checkCircleHit(locationX, locationY);
      },
      onPanResponderRelease: () => {
        setCurrentPos(null);
        handlePatternComplete();
      },
    })
  ).current;

  const checkCircleHit = (x, y) => {
    circles.forEach((circle) => {
      const distance = Math.sqrt(
        Math.pow(x - (circle.x + CIRCLE_SIZE / 2), 2) +
        Math.pow(y - (circle.y + CIRCLE_SIZE / 2), 2)
      );
      if (distance < CIRCLE_SIZE / 2 && !pattern.includes(circle.id)) {
        const newPattern = [...pattern, circle.id];
        setPattern(newPattern);
        if (pattern.length > 0) {
          const lastCircle = circles[pattern[pattern.length - 1]];
          setLines([...lines, {
            x1: lastCircle.x + CIRCLE_SIZE / 2,
            y1: lastCircle.y + CIRCLE_SIZE / 2,
            x2: circle.x + CIRCLE_SIZE / 2,
            y2: circle.y + CIRCLE_SIZE / 2,
          }]);
        }
      }
    });
  };

  const handlePatternComplete = () => {
    if (pattern.length < 4) {
      Alert.alert('提示', '至少连接4个点');
      resetPattern();
      return;
    }

    if (step === 'setup') {
      setConfirmPattern(pattern);
      setStep('confirm');
      resetPattern();
    } else if (step === 'confirm') {
      if (JSON.stringify(pattern) === JSON.stringify(confirmPattern)) {
        onSetup(pattern);
      } else {
        Alert.alert('错误', '两次手势不一致，请重新设置');
        setStep('setup');
        setConfirmPattern(null);
        resetPattern();
      }
    } else if (step === 'verify') {
      if (JSON.stringify(pattern) === JSON.stringify(storedPattern)) {
        onSuccess();
      } else {
        Alert.alert('错误', '手势密码错误');
        resetPattern();
      }
    }
  };

  const resetPattern = () => {
    setTimeout(() => {
      setPattern([]);
      setLines([]);
      setCurrentPos(null);
    }, 300);
  };

  const getMessage = () => {
    if (step === 'setup') return '绘制手势密码（至少4个点）';
    if (step === 'confirm') return '再次绘制确认';
    return '绘制手势密码解锁';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        {getMessage()}
      </Text>

      <View style={styles.gestureArea} {...panResponder.panHandlers}>
        {/* 绘制连线 */}
        {lines.map((line, index) => {
          const length = Math.sqrt(
            Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
          );
          const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * (180 / Math.PI);
          return (
            <View
              key={index}
              style={[
                styles.line,
                {
                  width: length,
                  left: line.x1,
                  top: line.y1,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          );
        })}

        {/* 当前拖动线 */}
        {currentPos && pattern.length > 0 && (
          <View
            style={[
              styles.line,
              {
                width: Math.sqrt(
                  Math.pow(currentPos.x - (circles[pattern[pattern.length - 1]].x + CIRCLE_SIZE / 2), 2) +
                  Math.pow(currentPos.y - (circles[pattern[pattern.length - 1]].y + CIRCLE_SIZE / 2), 2)
                ),
                left: circles[pattern[pattern.length - 1]].x + CIRCLE_SIZE / 2,
                top: circles[pattern[pattern.length - 1]].y + CIRCLE_SIZE / 2,
                transform: [{
                  rotate: `${Math.atan2(
                    currentPos.y - (circles[pattern[pattern.length - 1]].y + CIRCLE_SIZE / 2),
                    currentPos.x - (circles[pattern[pattern.length - 1]].x + CIRCLE_SIZE / 2)
                  ) * (180 / Math.PI)}deg`
                }],
                backgroundColor: theme.colors.primary,
                opacity: 0.5,
              },
            ]}
          />
        )}

        {/* 绘制圆点 */}
        {circles.map((circle) => (
          <View
            key={circle.id}
            style={[
              styles.circle,
              {
                left: circle.x,
                top: circle.y,
                borderColor: pattern.includes(circle.id) ? theme.colors.primary : theme.colors.outline,
                backgroundColor: pattern.includes(circle.id) ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            {pattern.includes(circle.id) && (
              <View style={[styles.innerCircle, { backgroundColor: theme.colors.surface }]} />
            )}
          </View>
        ))}
      </View>

      {step === 'setup' && (
        <Button mode="text" onPress={() => setStep('setup')}>
          重新绘制
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 50,
    textAlign: 'center',
  },
  gestureArea: {
    width: width,
    height: 400,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
});
